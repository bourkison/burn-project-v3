<template>
    <b-card class="homepageRecentWorkoutsCont" no-body>
        <b-card-body>
            <b-card-title><h5>Recent Workouts</h5></b-card-title>

            <div v-if="!isLoading">
                <canvas id="homepageRecentWorkouts"></canvas>
            </div>
            <div v-else class="align-items text-center">
                <b-spinner small />
            </div>
        </b-card-body>
    </b-card>
</template>

<script>
import { db } from '@/firebase'
import { Chart, registerables } from 'chart.js'
import dayjs from 'dayjs'

export default {
    name: 'RecentWorkoutsChart',
    data() {
        return {
            isLoading: true,
            amountOfValues: 6,

            // Chart.js
            delayed: false,
            chartLabels: [],
            chartData: []
        }
    },

    mounted: function() {
        this.chartLabels = this.buildDayLabels();
        let burnData = [];

        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("burns").where("createdAt", ">=", this.chartLabels[0]).orderBy("createdAt").get()
        .then(burnSnapshot => {
            burnSnapshot.forEach(burnDoc => {
                burnData.push(burnDoc.data());
            })

            this.chartLabels.forEach((label, i) => {
                let temp = burnData.filter(x => { 
                    if (i !== this.chartLabels.length - 1) {
                        if (dayjs(x.createdAt.toDate()).isAfter(dayjs(label)) && dayjs(x.createdAt.toDate()).isBefore(dayjs(this.chartLabels[i + 1]))) {
                            return true;
                        }
                    } else {
                        if (dayjs(x.createdAt.toDate()).isAfter(dayjs(label))) {
                            return true;
                        }
                    }
                })

                this.chartData.push(temp.length);
                this.chartLabels[i] = dayjs(label).format("DD-MM");
            })

            console.log("LABELS:", this.chartLabels, "DATA", this.chartData);
            this.isLoading = false;
            this.$nextTick(() => { this.buildChart() });
        })
    },

    methods: {
        buildChart: function() {
            Chart.register(...registerables);
            let ctx = document.querySelector("#homepageRecentWorkouts");
            ctx.height = 400;

            let chartType = "bar";
            let chartData = {
                labels: this.chartLabels,
                datasets: [
                    {
                        label: "Number of Workouts",
                        data:  this.chartData,
                        backgroundColor: "#007bff",
                        borderColor: "#007bff",
                        lineTension: 0,
                        pointBackgroundColor: "#007bff",
                    }
                ],
            };
            var options = {
                animation: {
                    onComplete: () => {
                        this.delayed = true;
                    },
                    delay: (context) => {
                        let delay = 0;
                        if (context.type === 'data' && context.mode === 'default' && !this.delayed) {
                        delay = context.dataIndex * 300 + context.datasetIndex * 100;
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
            const chart = new Chart(ctx, { type: chartType, data: chartData, options: options })
        },

        buildDayLabels: function() {
            let arrayOfDates = [];
            let mondayThisWeek;

            if (dayjs().day() === 0) {
                mondayThisWeek = dayjs().subtract(1, 'week').day(1);
            } else {
                mondayThisWeek = dayjs().day(1);
            }

            for (let i = this.amountOfValues - 1; i >= 0; i --) {
                arrayOfDates.push(mondayThisWeek.subtract(i, 'week').toDate());
            }

            return arrayOfDates;
        }
    }
}
</script>

<style scoped>
    .homepageRecentWorkoutsCont {
        margin-top: 25px;
    }

    .align-items {
        align-items: center !important;
    }
</style>