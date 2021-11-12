<template>
<div>
    <div class="card-flip" ref="cardFlip" :style="'height:' + cardHeight">
        <div class="flipper">
            <div class="front" ref="frontCard">
                <b-card no-body>
                    <b-card-body>
                        <div v-if="!isLoading">
                            <b-card-title>
                                <div class="d-flex align-items">
                                    <div><h6 class="d-inline-block vertical-align">One Rep Max</h6></div>
                                    <div class="ml-auto"><b-icon-bar-chart-line-fill class="clickableIcon" @click="flipCard" scale="0.5" /></div>
                                </div>
                            </b-card-title>
                            <canvas id="oneRepMaxChart"></canvas>
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
import 'chartjs-adapter-date-fns';
import { API } from "aws-amplify"

export default {
    name: "OneRepMaxExerciseChart",
    props: {
        // exercisePosition: {
        //     type: Number,
        //     required: true
        // },
        username: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            amountInChart: 8,
            isLoading: true,
            selectedExercise: null,

            cardHeight: "300px",

            // Chart.js
            delayed: false,
            chartLabels: [],
            chartDataORM: [],
            chartDataReps: []
        };
    },

    mounted: async function() {
        this.getData();
        console.log("FRONT:", this.$refs.frontCard.offsetHeight);
    },

    methods: {
        getData: async function() {
            const path = "/stats/onerepmax";
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                },
                queryStringParameters: {
                    exerciseId: "6106652690f6f5000859c8fc",
                    username: this.$props.username,
                    dataToPull: "orm,totalReps"
                }
            };

            const response = await API.get(this.$store.state.apiName, path, myInit);

            this.chartDataORM = response.data.orm;
            this.chartDataReps = response.data.totalReps;
            this.chartLabels = Object.keys(response.data.orm);

            this.isLoading = false;

            this.$nextTick(() => { this.buildChart() });
        },
        
        buildChart: function() {
            Chart.register(...registerables);
            let ctx = this.$el.querySelector("#oneRepMaxChart");
            ctx.height = 300;

            let chartType = "line";
            let chartData = {
                labels: this.chartLabels,
                datasets: [
                    {
                        label: "One Rep Maximum",
                        data: this.chartDataORM,
                        backgroundColor: "#007bff",
                        borderColor: "#007bff",
                        lineTension: 0.25,
                        pointBackgroundColor: "#007bff",
                        yAxisID: "y"
                    },
                    {
                        label: "Total Reps",
                        type: "bar",
                        data: this.chartDataReps,
                        backgroundColor: "rgba(0, 123, 255, 0.5)",
                        borderColor: "#007bff",
                        pointBackgroundColor: "#007bff",
                        yAxisID: "y1"
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
                            delay = context.dataIndex * 150 + context.datasetIndex * 50;
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
                        type: "time",
                        grid: {
                            display: false
                        },
                        title: {
                            text: "Week Commencing"
                        },
                        time: {
                            unit: "day",
                            tooltipFormat: "dd MMM"
                        }
                    },
                    y: {
                        type: "linear",
                        display: true,
                        position: "left"
                    },
                    y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        grid: {
                            drawOnChartArea: false
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

        flipCard: function() {
            this.$refs.cardFlip.classList.toggle("flipped");

            if (this.$refs.cardFlip.classList.contains("flipped")) {
                this.cardHeight = this.$refs.backCard.offsetHeight + "px";
            } else {
                this.cardHeight = this.$refs.frontCard.offsetHeight + "px";
            }
        }
    }
};
</script>

<style scoped>
    /*
        * Flip Card: https://codepen.io/darkwing/pen/bCali
    */ 

    .align-items {
        align-items: center !important;
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
