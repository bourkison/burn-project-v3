<template>
    <b-card no-body>
        <b-card-body>
            <b-card-title><h5>Workouts per Week</h5></b-card-title>

            <div v-if="!isLoading">
                <canvas id="recentWorkoutsChart"></canvas>
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
    props: {
        userId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            amountOfValues: 6,
            burnData: [],

            // Chart.js
            delayed: false,
            chartLabels: [],
            chartData: []
        }
    },

    mounted: async function() {
        this.chartLabels = this.buildDayLabels();

        if (this.$props.userId !== this.$store.state.userProfile.data.uid) {
             db.collection("users").doc(this.$props.userId).collection("burns").where("createdAt", ">=", this.chartLabels[0]).orderBy("createdAt").get()
            .then(burnSnapshot => {
                burnSnapshot.forEach(burnDoc => {
                    this.burnData.push(burnDoc.data());
                })

                this.buildChartData();
            })
        } else {
            if (this.$store.state.userBurns === null) {
                await this.$store.dispatch("fetchBurns", this.$store.state.userProfile.data);
            }

            this.burnData = this.$store.state.userBurns.filter(x => { 
                if (dayjs(this.chartLabels[0]).isBefore(dayjs(x.createdAt.toDate()))) {
                    return true
                } else {
                    return false;
                }
            })

            this.buildChartData();
        }
    },

    methods: {
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
                        data:  this.chartData,
                        backgroundColor: "#007bff",
                        borderColor: "#007bff",
                        lineTension: 0,
                        pointBackgroundColor: "#007bff",
                    }
                ],
            };
            let options = {
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
        },

        buildChartData: function() {
            this.chartLabels.forEach((label, i) => {
                let temp = this.burnData.filter(x => { 
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

            this.isLoading = false;
            this.$nextTick(() => { this.buildChart() });
        }
    }
}
</script>

<style scoped>
    .align-items {
        align-items: center !important;
    }
</style>