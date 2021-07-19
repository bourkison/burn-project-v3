<template>
    <b-card no-body>
        <b-card-body>
            <div v-if="!isLoading">
                <b-card-title><h6>{{ selectedExercise.name }} One Rep Max</h6></b-card-title>
                <canvas id="oneRepMaxChart"></canvas>
            </div>
            <div v-else class="align-items text-center">
                <b-spinner small />
            </div>
        </b-card-body>
    </b-card>
</template>

<script>
import dayjs from 'dayjs'
import { Chart, registerables } from 'chart.js'

export default {
    name: 'OneRepMaxExerciseChart',
    props: {
        exercisePosition: {
            type: Number,
            required: true
        },
        userId: {
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
            chartDataReps: [],
        }
    },

    mounted: async function() {
        if (this.$props.userId !== this.$store.state.userProfile.data.uid) {
            console.log("Not loading 1RM chart for this user.")
        } else {
            if (this.$store.state.userWorkouts === null) {
                await this.$store.dispatch("fetchWorkouts", this.$store.state.userProfile.data);
            }

            this.buildChartData();
            this.$nextTick (() => { this.buildChart() });
        }
    },

    methods: {
        buildChart: function() {
            Chart.register(...registerables);
            console.log(this.$el.querySelector("canvas"));
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
                        type: 'bar',
                        data: this.chartDataReps,
                        backgroundColor: "rgba(0, 123, 255, 0.5)",
                        borderColor: "#007bff",
                        pointBackgroundColor: "#007bff",
                        yAxisID: "y1"
                    }
                ]
            }
            let options = {
                animation: {
                    onComplete: () => {
                        this.delayed = true;
                    },
                    delay: (context) => {
                        let delay = 0;
                        if (context.type === 'data' && context.mode === 'default' && !this.delayed) {
                            delay = context.dataIndex * 150 + context.datasetIndex * 50;
                        }
                        return delay;
                    },
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
                            text: "Week Commencing",
                        },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }

            // eslint-disable-next-line
            const chart = new Chart(ctx, { type: chartType, data: chartData, options: options })
        },

        buildChartData: function() {
            let exerciseData = [];

            // Group exercises rather than workouts.
            this.$store.state.userWorkouts.forEach(workout => {
                workout.exercises.forEach(exercise => {
                    if (exerciseData[exercise.id]) {
                        exerciseData[exercise.id].push(exercise);
                        exerciseData[exercise.id][exerciseData[exercise.id].length - 1].createdAt = workout.createdAt.toDate();
                    } else {
                        exerciseData[exercise.id] = [exercise];
                        exerciseData[exercise.id][0].createdAt = workout.createdAt.toDate();
                    }
                })
            })

            exerciseData = Object.entries(exerciseData);

            // Now sort by amount done.
            exerciseData.sort((a, b) => {
                return b[1].length - a[1].length;
            })

            console.log(exerciseData);
            this.selectedExercise = {
                id: exerciseData[this.$props.exercisePosition][0],
                name: exerciseData[this.$props.exercisePosition][1][0].name,
                data: exerciseData[this.$props.exercisePosition][1]
            }

            if (this.amountInChart > this.selectedExercise.data.length) {
                this.amountInChart = this.selectedExercise.data.length;
            }

            for (let i = this.amountInChart - 1; i >= 0; i --) {
                this.chartLabels.push(dayjs(this.selectedExercise.data[i].createdAt).format("DD-MM"));
                
                // Calculate 1RM for every set and sort.
                let ormArr = [];
                let repsCounter = 0;

                this.selectedExercise.data[i].sets.forEach(set => {
                    ormArr.push(this.calcORM(set.kg, set.measureAmount));
                    repsCounter += set.measureAmount;
                })

                ormArr.sort((a, b) => { b - a });

                // Push the highest.
                this.chartDataORM.push(ormArr[0]);
                this.chartDataReps.push(repsCounter);
            }

            this.isLoading = false;
        },

        calcORM: function(amount, reps) {
            if (reps >= 30) {
                return amount / 0.50;
            } else if (reps <= 0 || amount <= 0) {
                return 0;
            }

            switch(reps) {
                case 1:
                    return Math.round((amount) * 2) / 2;
                case 2:
                    return Math.round((amount / 0.97) * 2) / 2;
                case 3:
                    return Math.round((amount / 0.94) * 2) / 2;
                case 4:
                    return Math.round((amount / 0.92) * 2) / 2;
                case 5:
                    return Math.round((amount / 0.89) * 2) / 2;
                case 6:
                    return Math.round((amount / 0.86) * 2) / 2;
                case 7:
                    return Math.round((amount / 0.83) * 2) / 2;
                case 8:
                    return Math.round((amount / 0.81) * 2) / 2;
                case 9:
                    return Math.round((amount / 0.78) * 2) / 2;
                case 10:
                    return Math.round((amount / 0.75) * 2) / 2;
                case 11:
                    return Math.round((amount / 0.73) * 2) / 2;
                case 12:
                    return Math.round((amount / 0.71) * 2) / 2;
                case 13:
                    return Math.round((amount / 0.70) * 2) / 2;
                case 14:
                    return Math.round((amount / 0.68) * 2) / 2;
                case 15:
                    return Math.round((amount / 0.67) * 2) / 2;
                case 16:
                    return Math.round((amount / 0.65) * 2) / 2;
                case 17:
                    return Math.round((amount / 0.64) * 2) / 2;
                case 18:
                    return Math.round((amount / 0.63) * 2) / 2;
                case 19:
                    return Math.round((amount / 0.61) * 2) / 2;
                case 20:
                    return Math.round((amount / 0.60) * 2) / 2;
                case 21:
                    return Math.round((amount / 0.59) * 2) / 2;
                case 22:
                    return Math.round((amount / 0.58) * 2) / 2;
                case 23:
                    return Math.round((amount / 0.57) * 2) / 2;
                case 24:
                    return Math.round((amount / 0.56) * 2) / 2;
                case 25:
                    return Math.round((amount / 0.55) * 2) / 2;
                case 26:
                    return Math.round((amount / 0.54) * 2) / 2;
                case 27:
                    return Math.round((amount / 0.53) * 2) / 2;
                case 28: 
                    return Math.round((amount / 0.52) * 2) / 2;
                case 29:
                    return Math.round((amount / 0.51) * 2) / 2;
            }
        }
    }
}
</script>

<style scoped>
    .align-items {
        align-items: center !important;
    }
</style>