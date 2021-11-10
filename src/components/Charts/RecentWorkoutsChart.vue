<template>
    <b-card no-body>
        <b-card-body>
            <b-card-title><h6>Workouts per Week</h6></b-card-title>

            <div v-if="!isLoading && hasData">
                <canvas id="recentWorkoutsChart"></canvas>
            </div>
            <div
                v-else-if="!isLoading && !hasData"
                class="align-items text-center text-muted small-font mt-3"
            >
                No recent workouts!
            </div>
            <div v-else class="align-items text-center">
                <b-spinner small />
            </div>
        </b-card-body>
    </b-card>
</template>

<script>
import { Chart, registerables } from "chart.js";
import dayjs from "dayjs";
import { API } from "aws-amplify";

export default {
    name: "RecentWorkoutsChart",
    // props: {
    //     userId: {
    //         type: String,
    //         required: true
    //     }
    // },
    data() {
        return {
            isLoading: true,
            amountOfValues: 6,
            hasData: false,

            // Chart.js
            delayed: false,
            chartLabels: [],
            chartData: []
        };
    },

    mounted: function() {
        this.chartLabels = this.buildDayLabels();
        this.getData();
    },

    methods: {
        getData: async function() {
            const path = "/stats/recentWorkouts";
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                },
                queryStringParameters: {
                    startDate: this.chartLabels[0].getTime(),
                    endDate: new Date().getTime(),
                    username: this.$store.state.userProfile.docData.username
                }
            }

            const response = await API.get(this.$store.state.apiName, path, myInit)

            this.buildChartData(response.data);
        },

        buildChart: function() {
            Chart.register(...registerables);
            let ctx = this.$el.querySelector("#recentWorkoutsChart");
            ctx.height = 400;

            let chartType = "bar";
            let chartData = {
                labels: this.chartLabels,
                datasets: [
                    {
                        label: "Number of Workouts",
                        data: this.chartData,
                        backgroundColor: "#007bff",
                        borderColor: "#007bff",
                        lineTension: 0,
                        pointBackgroundColor: "#007bff"
                    }
                ]
            };
            let options = {
                animation: {
                    onComplete: () => {
                        this.delayed = true;
                    },
                    delay: context => {
                        let delay = 0;
                        if (
                            context.type === "data" &&
                            context.mode === "default" &&
                            !this.delayed
                        ) {
                            delay =
                                context.dataIndex * 300 +
                                context.datasetIndex * 100;
                        }
                        return delay;
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: "Week Commencing"
                        }
                    },
                    y: {
                        suggestedMax: 4,
                        grid: {
                            display: false
                        },
                        ticks: {
                            precision: 0
                        }
                    }
                }
            };

            // eslint-disable-next-line
            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: options
            });
        },

        buildDayLabels: function() {
            let arrayOfDates = [];
            let mondayThisWeek;

            let today = dayjs()
                .set("second", 0)
                .set("minute", 0)
                .set("hour", 0);

            if (today.day() === 0) {
                mondayThisWeek = today.subtract(1, "week").day(1);
            } else {
                mondayThisWeek = today.day(1);
            }

            for (let i = this.amountOfValues - 1; i >= 0; i--) {
                arrayOfDates.push(mondayThisWeek.subtract(i, "week").toDate());
            }

            return arrayOfDates;
        },

        buildChartData: function(input) {
            let dates = Object.keys(input);
            let amounts = Object.values(input);
            let data = [];

            // First change data to be same length as labels, with all 0s.
            for (let i = 0; i < this.chartLabels.length; i ++) {
                data.push(0);
            }

            if (dates.length) {
                this.hasData = true;

                for (let i = 0; i < dates.length; i++) {
                    let date = new Date(dates[i]);

                    for (let j = 0; j < this.chartLabels.length; j ++) {
                        // If we're on last iterator, push to last value in data array.
                        if (j === this.chartLabels.length - 1) {
                            data[j] += amounts[i];
                            break;
                        }

                        // Else check if data is greater than this iterator, and less than the next.
                        if (date.getTime() >= new Date(this.chartLabels[j]).getTime() && date.getTime() < new Date(this.chartLabels[j + 1]).getTime()) {
                            data[j] += amounts[i];
                            break;
                        }
                    }
                }

                // Finally, prettify Chart Labels.
                for (let i = 0; i < this.chartLabels.length; i ++) {
                    this.chartLabels[i] = dayjs(this.chartLabels[i]).format("DD MMM");
                }
            } else {
                this.hasData = false;
                this.isLoading = false;
            }

            this.chartData = data;
            this.isLoading = false;
            console.log("DATA:", this.chartLabels, this.chartData);
            this.$nextTick(() => { this.buildChart() });
        }
    },

    // watch: {
    //     userId: function() {
    //         this.isLoading = true;
    //         this.delayed = false;
    //         this.chartLabels = [];
    //         this.chartData = [];
    //         console.log("RESET");
    //         this.$nextTick(() => {
    //             this.commenceBuild();
    //         });
    //     }
    // }
};
</script>

<style scoped>
.align-items {
    align-items: center !important;
}

.small-font {
    font-size: 12px !important;
}
</style>
