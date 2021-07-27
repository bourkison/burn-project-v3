<template>
    <b-card no-body>
        <b-card-body>
            <b-card-title><h6>Workouts per Week</h6></b-card-title>

            <div v-if="!isLoading && recentWorkouts">
                <canvas id="recentWorkoutsChart"></canvas>
            </div>
            <div
                v-else-if="!isLoading && !recentWorkouts"
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
import { userWorkoutsCollection } from "@/firebase";
import { Chart, registerables } from "chart.js";
import dayjs from "dayjs";

export default {
    name: "RecentWorkoutsChart",
    props: {
        userId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            recentWorkouts: false,
            amountOfValues: 6,
            workoutData: [],

            // Chart.js
            delayed: false,
            chartLabels: [],
            chartData: []
        };
    },

    mounted: function() {
        this.commenceBuild();
    },

    methods: {
        commenceBuild: async function() {
            this.chartLabels = this.buildDayLabels();

            if (this.$props.userId !== this.$store.state.userProfile.data.uid) {
                userWorkoutsCollection(this.$store.state.userProfile.data.uid)
                    .where("createdAt", ">=", this.chartLabels[0])
                    .orderBy("createdAt")
                    .get()
                    .then(workoutSnapshot => {
                        workoutSnapshot.forEach(workoutDoc => {
                            this.workoutData.push(workoutDoc.data());
                        });

                        this.buildChartData();
                    });
            } else {
                if (this.$store.state.userWorkouts === null) {
                    await this.$store.dispatch(
                        "fetchWorkouts",
                        this.$store.state.userProfile.data
                    );
                }

                this.workoutData = this.$store.state.userWorkouts.filter(x => {
                    if (
                        dayjs(this.chartLabels[0]).isBefore(
                            dayjs(x.createdAt.toDate())
                        )
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                });

                this.buildChartData();
            }
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

        buildChartData: function() {
            this.chartLabels.forEach((label, i) => {
                let temp = this.workoutData.filter(x => {
                    if (i !== this.chartLabels.length - 1) {
                        if (
                            dayjs(x.createdAt.toDate()).isAfter(dayjs(label)) &&
                            dayjs(x.createdAt.toDate()).isBefore(
                                dayjs(this.chartLabels[i + 1])
                            )
                        ) {
                            return true;
                        }
                    } else {
                        if (dayjs(x.createdAt.toDate()).isAfter(dayjs(label))) {
                            return true;
                        }
                    }
                });

                this.chartData.push(temp.length);
                this.chartLabels[i] = dayjs(label).format("DD-MM");
            });

            this.chartData.forEach(week => {
                if (week > 0) {
                    this.recentWorkouts = true;
                }
            });

            this.isLoading = false;

            if (this.recentWorkouts) {
                this.$nextTick(() => {
                    this.buildChart();
                });
            }
        }
    },

    watch: {
        userId: function() {
            this.isLoading = true;
            this.workoutData = [];
            this.delayed = false;
            this.chartLabels = [];
            this.chartData = [];
            console.log("RESET");
            this.$nextTick(() => {
                this.commenceBuild();
            });
        }
    }
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
