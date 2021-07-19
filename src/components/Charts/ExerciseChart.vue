<template>
    <div v-if="dataExists && !isLoading">
        <canvas class="exerciseChart"></canvas>
    </div>
    <div v-else-if="isLoading">

    </div>
    <div v-else>

    </div>
</template>

<script>
// import { userWorkoutsCollection } from '@/firebase'
import dayjs from 'dayjs'
import { Chart, registerables } from 'chart.js';

export default {
    name: 'ExerciseChart',
    props: {
        exerciseId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            amountInChart: 8,
            burnData: [],
            exerciseData: [],
            dataExists: true,

            // DATA:
            weightLiftedData: [],
            ormData: [],
            repsData: [],

            // Chart.js
            chartLabels: []
        }
    },

    created: async function() {
        await this.getBurns();
        this.buildOrmData();
        this.buildRepsData();
        this.buildWeightLiftedData();
        this.buildLabels();
        this.$nextTick (() => { this.buildChart() });
    },

    methods: {
        getBurns: async function() {
            if (this.$store.state.userBurns == null) {
                await this.$store.dispatch('fetchBurns', this.$store.state.userProfile.data);
            }

            this.burnData = this.$store.state.userBurns.filter(x => { 
                if (x.exerciseIds && x.exerciseIds.includes(this.$props.exerciseId)) {
                    return true;
                } else {
                    return false;
                }
            });

            // Push all sets from burn into an array.
            // Do this way as there may be more than one of the same exercise within a burn.
            this.burnData.forEach(burn => {
                let exerciseArr = [];
                burn.exercises.forEach(exercise => {
                    if (exercise.id === this.$props.exerciseId) {
                        console.log("EX:", exercise)
                        exercise.sets.forEach(set => {
                            exerciseArr.push(set);
                        })
                    }
                })
                this.exerciseData.push(exerciseArr);
            })

            this.dataExists = true;
            this.isLoading = false;

            // if (this.burnData.length < this.amountInChart) {
            //     console.log(this.$props.exerciseId);
            //     const burnSnapshot = await userWorkoutsCollection(this.$store.state.userProfile.data.uid).where("exerciseIds", "array-contains", this.$props.exerciseId).orderBy("createdAt").limit(this.amountInChart).get();
                
            //     if (burnSnapshot.size > 0) {
            //         burnSnapshot.forEach(burnDoc => {
            //             this.burnData.push(burnDoc.data());
            //         })
            //     } else {
            //         this.dataExists = false;
            //     }
            // } else {
            //     this.dataExists = true;
            // }
        },

        buildLabels: function() {
            this.burnData.forEach(burn => {
                this.chartLabels.push(dayjs(burn.createdAt.toDate()).format("DD-MM"));
            })
        },

        buildChart: function() {
            Chart.register(...registerables);
            let ctx = this.$el.querySelector(".exerciseChart");
            ctx.height = 300;

            let chartType = "line";
            let chartData = {
                labels: this.chartLabels,
                datasets: [
                    {
                        label: "One Rep Maximum",
                        data: this.ormData,
                        backgroundColor: "#007bff",
                        borderColor: "#007bff",
                        lineTension: 0.25,
                        pointBackgroundColor: "#007bff",
                        yAxisID: "y"
                    },
                    {
                        label: "Total Reps",
                        type: 'bar',
                        data: this.repsData,
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

        buildWeightLiftedData: function() {
            this.exerciseData.forEach(exercise => {
                let weightLifted = 0;

                exercise.forEach(set => {
                    weightLifted += set.measureAmount * set.kg;
                })

                this.weightLiftedData.push(weightLifted);
            })
        },

        buildOrmData: function() {
            this.exerciseData.forEach(exercise => {
                let ormArr = [];

                exercise.forEach(set => {
                    ormArr.push(this.calcORM(set.kg, set.measureAmount))
                })

                ormArr.sort((a, b) => { b - a });
                this.ormData.push(ormArr[0]);
            })
        },

        buildRepsData: function() {
            this.exerciseData.forEach(exercise => {
                let totalReps = 0;

                exercise.forEach(set => {
                    totalReps += set.measureAmount;
                })

                this.repsData.push(totalReps);
            })
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