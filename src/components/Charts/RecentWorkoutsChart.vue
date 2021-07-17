<template>
    <div>
        <canvas id="testCanvas"></canvas>
    </div>
</template>

<script>
import { Chart, registerables } from 'chart.js'

export default {
    name: 'RecentWorkoutsChart',
    data() {
        return {
            delayed: false,
        }
    },

    mounted: function() {
        Chart.register(...registerables);
        let ctx = document.querySelector("#testCanvas");

        let chartType = "bar";
        let chartData = {
            labels: ["Jan1", "Jan2", "Jan3", "Jan4", "Jan5", "Jan6", "Jan7"],
            datasets: [
                {
                    label: "This week",
                    data:  [12, 19, 10, 17, 6, 3, 7],
                    backgroundColor: "rgba(224, 248, 255, 0.4)",
                    borderColor: "#5cddff",
                    lineTension: 0,
                    pointBackgroundColor: "#5cddff",
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
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        };

        const chart = new Chart(ctx, {
            type: chartType,
            data: chartData,
            options: options
        })

        console.log(chart);
    }
}
</script>