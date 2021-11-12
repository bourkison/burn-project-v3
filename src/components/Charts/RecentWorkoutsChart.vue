<template>
<div>
    <div class="card-flip" ref="cardFlip" :style="'height:' + cardHeight">
        <div class="flipper">
            <div class="front" ref="frontCard">
                <b-card no-body>
                    <b-card-body>
                        <b-card-title>
                            <div class="d-flex align-items">
                                <div><h6 class="d-inline-block vertical-align">Workouts per Week</h6></div>
                                <div class="ml-auto"><b-icon-bar-chart-line-fill class="clickableIcon" @click="flipCard" scale="0.5" /></div>
                            </div>
                        </b-card-title>

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
            </div>
            <div class="back" ref="backCard">
                <b-card no-body>
                    <b-card-body>
                        <b-card-title>
                            <div class="d-flex align-items">
                                <div><h6 class="d-inline-block vertical-align">Edit Card</h6></div>
                                <div class="ml-auto"><b-icon-bar-chart-line-fill class="clickableIcon" @click="flipCard" scale="0.5" /></div>
                            </div>
                        </b-card-title>
                    </b-card-body>
                </b-card>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { Chart, registerables } from "chart.js";
import dayjs from "dayjs";
import { API } from "aws-amplify";

export default {
    name: "RecentWorkoutsChart",
    props: {
        username: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            amountOfValues: 6,
            hasData: false,

            cardHeight: "370px",

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
            const path = "/stats/recentworkouts";
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                },
                queryStringParameters: {
                    startDate: this.chartLabels[0].getTime(),
                    endDate: new Date().getTime(),
                    username: this.$props.username
                }
            };

            const response = await API.get(this.$store.state.apiName, path, myInit);

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
                        label: "Workouts",
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
                            delay = context.dataIndex * 300 + context.datasetIndex * 100;
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

            new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: options
            });

            // Once Chart is built, now need to set the height of the card.
            this.$nextTick(() => {
                if (this.$refs.frontCard.offsetHeight > this.$refs.backCard.offsetHeight) {
                    this.cardHeight = this.$refs.frontCard.offsetHeight + "px";
                } else {
                    this.cardHeight = this.$refs.backCard.offsetHeight + "px";
                }
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
            for (let i = 0; i < this.chartLabels.length; i++) {
                data.push(0);
            }

            if (dates.length) {
                this.hasData = true;

                for (let i = 0; i < dates.length; i++) {
                    let date = new Date(dates[i]);

                    for (let j = 0; j < this.chartLabels.length; j++) {
                        // If we're on last iterator, push to last value in data array.
                        if (j === this.chartLabels.length - 1) {
                            data[j] += amounts[i];
                            break;
                        }

                        // Else check if data is greater than this iterator, and less than the next.
                        if (
                            date.getTime() >= new Date(this.chartLabels[j]).getTime() &&
                            date.getTime() < new Date(this.chartLabels[j + 1]).getTime()
                        ) {
                            data[j] += amounts[i];
                            break;
                        }
                    }
                }

                // Finally, prettify Chart Labels.
                for (let i = 0; i < this.chartLabels.length; i++) {
                    this.chartLabels[i] = dayjs(this.chartLabels[i]).format("DD MMM");
                }
            } else {
                this.hasData = false;
                this.isLoading = false;
            }

            this.chartData = data;
            this.isLoading = false;
            console.log("DATA:", this.chartLabels, this.chartData);
            this.$nextTick(() => {
                this.buildChart();
            });
        },

        flipCard: function() {
            this.$refs.cardFlip.classList.toggle("flipped");
        }
    }

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

    .vertical-align {
        vertical-align: middle !important;
    }

    .card-flip {
        -webkit-perspective: 1000px;
        -moz-perspective: 1000px;
        -o-perspective: 1000px;
        perspective: 1000px;
    }

    .card-flip.flipped .flipper {
        -webkit-transform: rotateY(180deg);
		-moz-transform: rotateY(180deg);
        -o-transform: rotateY(180deg);
		transform: rotateY(180deg);
    }

    .flipper {
        -webkit-transition: 0.6s;
        -webkit-transform-style: preserve-3d;

        -moz-transition: 0.6s;
        -moz-transform-style: preserve-3d;
    
        -o-transition: 0.6s;
        -o-transform-style: preserve-3d;

        transition: 0.6s;
        transform-style: preserve-3d;

        position: relative;
    }

    .flip {
        transition: 0.6s;
        transform-style: preserve-3d;
        position: relative;
    }

    .front,
    .back {
        -webkit-backface-visibility: hidden;
        -moz-backface-visibility: hidden;
        -o-backface-visibility: hidden;
        backface-visibility: hidden;

        position: absolute;
        width: 100%;
        top: 0;
        left: 0;
    }

    .front {
        z-index: 2;
        transform: rotateY(0deg);
    }

    .back {
        -webkit-transform: rotateY(180deg);
        -moz-transform: rotateY(180deg);
        -o-transform: rotateY(180deg);
        transform: rotateY(180deg);
    }

    .clickableIcon:hover {
        cursor: pointer;
    }
</style>
