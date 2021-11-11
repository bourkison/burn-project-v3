<template>
    <b-card no-body>
        <b-card-body>
            <div v-if="!isLoading">
                <b-card-title
                    ><h6>One Rep Max</h6></b-card-title
                >
                <canvas id="oneRepMaxChart"></canvas>
            </div>
            <div v-else class="align-items text-center">
                <b-spinner small />
            </div>
        </b-card-body>
    </b-card>
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

            // Chart.js
            delayed: false,
            chartLabels: [],
            chartDataORM: [],
            chartDataReps: []
        };
    },

    mounted: async function() {
        this.getData();
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
            console.log("THING:", this.isLoading);
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

            // eslint-disable-next-line
            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: options
            });
        }
    }
};
</script>

<style scoped>
.align-items {
    align-items: center !important;
}
</style>
