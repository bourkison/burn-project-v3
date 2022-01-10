<template>
    <div>
        <div class="card-flip" ref="cardFlip" :style="'height:' + cardHeight">
            <div class="flipper">
                <div class="front" ref="frontCard">
                    <b-card no-body>
                        <b-card-body ref="frontCardBody">
                            <div v-if="!isLoading && hasData">
                                <b-card-title>
                                    <div class="d-flex align-items-center">
                                        <div><h6 class="d-inline-block vertical-align">{{ cardTitle }}</h6></div>
                                        <div class="ml-auto" v-if="editable"><b-icon-bar-chart-line-fill class="clickableIcon" @click="flipCard(1)" scale="0.5" /></div>
                                    </div>
                                </b-card-title>
                                <canvas class="chart"></canvas>
                            </div>

                            <div v-else-if="!isLoading && !hasData">
                                <div class="align-items-center text-muted small-font">
                                    <div class="d-flex align-items-center p-2">
                                        <div>
                                            <span v-if="chartOptions.type ==='exercise'"><em>You have not recently done this exercise!</em></span>
                                            <span v-else><em>No Data</em></span>
                                        </div>
                                        <div class="ml-auto" v-if="editable"><b-icon-bar-chart-line-fill class="clickableIcon" @click="flipCard" /></div>
                                    </div>
                                </div>
                            </div>

                            <div v-else class="align-items-center text-center">
                                <b-spinner small />
                            </div>
                        </b-card-body>
                    </b-card>
                </div>

                <div class="back" ref="backCard" v-if="editable">
                    <b-card no-body>
                        <b-card-body ref="backCardBody" class="back-card-body" :style="'height:' + cardBodyHeight">
                            <b-card-title>
                                <div class="d-flex align-items-center">
                                    <div><h6 class="d-inline-block vertical-align">Edit Card</h6></div>
                                    <div class="ml-auto"><b-icon-bar-chart-line-fill class="clickableIcon" @click="flipCard(-1)" scale="0.5" /></div>
                                </div>
                            </b-card-title>

                            <div class="mt-2">
                                <b-form @submit.prevent="updateChart(false)">
                                    <b-form-group label="Chart Type" class="small-font">
                                        <div class="text-center">
                                            <b-form-radio-group v-model="newChartOptions.type" :options="chartTypeOptions" size="sm" button-variant="outline-primary" buttons />
                                        </div>
                                    </b-form-group>

                                    <b-form-group label="Background Color" class="small-font">
                                        <b-form-input type="color" v-model="newChartOptions.backgroundColor" size="sm" />
                                    </b-form-group>

                                    <b-form-group label="Border Color" class="small-font">
                                        <b-form-input type="color" v-model="newChartOptions.borderColor" size="sm" />
                                    </b-form-group>

                                    <b-form-group label="Point Color" class="small-font">
                                        <b-form-input type="color" v-model="newChartOptions.pointBackgroundColor" size="sm" />
                                    </b-form-group>

                                    <b-form-group label-for="startDateNumInput" class="small-font">
                                        <template #label>
                                            <div class="d-flex align-items-center">
                                                <div>Start Date</div>
                                                <div class="ml-auto"><b-icon-calendar @click="newStartDateDynamic = !newStartDateDynamic" class="clickableIcon" /></div>    
                                            </div>
                                        </template>

                                        <div v-if="newStartDateDynamic">
                                            <b-input-group size="sm">
                                                <b-form-input type="number" id="startDateNumInput" size="sm" v-model.number="newChartOptions.startDate.amount" />

                                                <b-input-group-addon>
                                                    <b-form-select :options="dateUnitOptions" v-model="newChartOptions.startDate.unit" size="sm" />
                                                </b-input-group-addon>

                                                <b-input-group-addon is-text>ago</b-input-group-addon>
                                            </b-input-group>
                                        </div>

                                        <div v-else>
                                            <b-form-datepicker v-model="newChartOptions.startDate.date" size="sm" boundary="window" />
                                        </div>
                                    </b-form-group>

                                    <b-form-group label-for="endDateNumInput" class="small-font">
                                        <template #label>
                                            <div class="d-flex align-items-center">
                                                <div>End Date</div>
                                                <div class="ml-auto"><b-icon-calendar @click="newEndDateDynamic = !newEndDateDynamic" class="clickableIcon" /></div>    
                                            </div>
                                        </template>

                                        <div v-if="newEndDateDynamic">
                                            <b-input-group size="sm">
                                                <b-form-input type="number" id="endDateNumInput" size="sm" v-model.number="newChartOptions.endDate.amount" />

                                                <b-input-group-addon>
                                                    <b-form-select :options="dateUnitOptions" v-model="newChartOptions.endDate.unit" size="sm" boundary="viewport" />
                                                </b-input-group-addon>

                                                <b-input-group-addon is-text>ago</b-input-group-addon>
                                            </b-input-group>
                                        </div>

                                        <div v-else>
                                            <b-form-datepicker v-model="newChartOptions.endDate.date" size="sm" boundary="viewport" />
                                        </div>
                                    </b-form-group>

                                    <b-form-group label="Interval" class="small-font">
                                        <div class="text-center">
                                            <b-form-radio-group v-model="newChartOptions.interval" :options="intervalOptions" size="sm" button-variant="outline-primary" buttons />
                                        </div>
                                    </b-form-group>

                                    <!-- EXERCISE CHART DATA -->
                                    <div v-if="newChartOptions.type === 'exercise'">
                                        <b-form-group class="small-font">
                                            <template #label>
                                                <div class="d-flex">
                                                    <div>Selected Exercise</div>
                                                    <div class="ml-auto"><b-icon-star class="clickableIcon" @click="newPreferredExercise = !newPreferredExercise" /></div>
                                                </div>
                                            </template>

                                            <div v-if="newPreferredExercise">
                                                <b-input-group size="sm">
                                                    <b-form-input type="number" v-model="preferenceIndex" />

                                                    <b-input-group-addon is-text>{{ preferenceIndexOrdinal }}</b-input-group-addon>
                                                </b-input-group>
                                            </div>

                                            <div v-else>
                                                <div v-if="selectedExercise.exerciseId" class="text-center small-font text-muted mb-1">Selected: {{ selectedExercise.name }}</div>

                                                <b-button block @click="searchExerciseModal = !searchExerciseModal" variant="primary"  size="sm">Select Exercise</b-button>

                                                <b-modal v-model="searchExerciseModal" centered title="Select Exercise" hide-footer button-size="sm">
                                                    <ExerciseSearch @selectExercise="selectExercise" />
                                                </b-modal>
                                            </div>
                                        </b-form-group>

                                        <b-form-group label="Data (up to 2)" class="small-font">
                                            <b-form-checkbox-group :options="exerciseDataOptions" v-model="newDataToPull">
                                                <b-form-invalid-feedback :state="validDataToPull">Please select either one or two.</b-form-invalid-feedback>
                                            </b-form-checkbox-group>
                                        </b-form-group>
                                    </div>

                                    <div class="text-center">
                                        <b-button type="submit" size="sm" variant="outline-dark" :disabled="isLoading">
                                            <div v-if="!isUpdating">View</div>
                                            <div v-else><b-spinner small /></div>
                                        </b-button>

                                        <b-button size="sm" v-if="saveable" variant="outline-success" class="ml-1" :disabled="isLoading" @click="updateChart(true)">
                                            <div v-if="!isSaving">Save</div>
                                            <div v-else><b-spinner small /></div>
                                        </b-button>
                                    </div> 
                                </b-form>
                            </div>
                        </b-card-body>
                    </b-card>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { API } from 'aws-amplify';
import { Chart, registerables } from "chart.js";
import 'chartjs-adapter-date-fns';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import ExerciseSearch from "@/components/Exercise/ExerciseSearch";

export default {
    name: 'Chart',
    components: { ExerciseSearch },
    props: {
        username: {
            type: String,
            required: true
        },
        options: {
            type: Object,
            default() {
                return {}
            }
        },
        editable: {
            type: Boolean,
            default: false
        },
        saveable: {
            type: Boolean,
            default: false
        },
        position: {
            type: String,
            required: true
        },
        index: {
            type: Number,
            required: true
        },
        persistent: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            isUpdating: false,
            isSaving: false,
            hasData: false,
            cardHeight: "366px",
            cardBodyHeight: "326px",
            cardTitle: "",
            startDate: null,
            endDate: null,
            endDateToday: false,

            // Chart Data Options:
            trimLabels: false,

            // Default chart options:
            chartOptions: {
                backgroundColor: "#007bff",
                borderColor: "#007bff",
                pointBackgroundColor: "#007bff",
                startDate: {
                    unit: "week",
                    amount: 6,
                    date: null
                },
                endDate: {
                    unit: "",
                    amount: 0,
                    date: null
                },
                interval: "week",
                data: {}
            },

            newChartOptions: {},
            // All possible data input.
            newChartData: {
                preferenceIndex: 0,
                exercise: {},
                dataToPull: "",
            },
            
            selectedExercise: {},

            newStartDateDynamic: true,
            newEndDateDynamic: true,
            newPreferredExercise: true,

            // Chart.js
            delayed: false,
            chartLabels: [],
            chartData: {},
            chart: null,

            // Bootstrap
            chartTypeOptions: [
                { value: "recentWorkouts", text: "Workout" },
                { value: "exercise", text: "Exercise" }
            ],
            dateUnitOptions: [
                { value: "day", text: "days" },
                { value: "week", text: "weeks" },
                { value: "month", text: "months" }
            ],
            intervalOptions: [
                { value: "day", text: "Daily" },
                { value: "week", text: "Weekly" },
                { value: "month", text: "Monthly" }
            ],
            exerciseDataOptions: [
                { value: "orm", text: "ORM" },
                { value: "totalVolume", text: "Total Volume" },
                { value: "totalReps", text: "Total Reps" }
            ],
            searchExerciseModal: false,
        }
    },

    computed: {
        preferenceIndex: {
            get() {
                return (this.newChartData.preferenceIndex + 1).toString();
            },
            set(value) {
                this.newChartData.preferenceIndex = Number(value) - 1;
            }
        },

        preferenceIndexOrdinal() {
            switch (this.preferenceIndex) {
                case "1":
                    return "st favourite"
                case "2":
                    return "nd favourite"
                case "3":
                    return "rd favourite"
            }

            return "th favourite"
        },

        newDataToPull: {
            get() {
                return this.newChartData.dataToPull.split(",")
            },
            set(value) {
                this.newChartData.dataToPull = value.filter(x => { return x }).join(",");
            }
        },

        validDataToPull() {
            if (this.newDataToPull.length > 2 || !this.newDataToPull[0]) {
                return false;
            }

            return true;
        }
    },

    created() {
        this.resetVariables();
    },

    mounted() {
        dayjs.extend(isSameOrAfter);
        dayjs.extend(isSameOrBefore);

        this.getData();

        // Add transition end event that hides chart when flipped.
        this.$refs.cardFlip.addEventListener("transitionend", () => {
            if (this.$refs.cardFlip.classList.contains("flipped") && this.$el.querySelector(".chart")) {
                this.$el.querySelector(".chart").style.display = "none";
            }
        })
    },

    methods: {
        async getData() {
            try {
                if (!this.$props.options.type) {
                    throw new Error("No chart type given")
                }

                this.resetVariables();

                // Format edit values:
                if (this.chartOptions.startDate.date) {
                    this.newStartDateDynamic = true
                }

                if (this.chartOptions.endDate.date) {
                    this.newEndDateDynamic = true
                }

                if (this.chartOptions.type === "exercise") {
                    this.trimLabels = true;

                    if (this.chartOptions.data.exercise && this.chartOptions.data.exercise.exerciseId) {
                        this.newPreferredExercise = false;
                        this.selectedExercise = this.chartOptions.data.exercise;
                    }
                }

                this.endDateToday = this.chartOptions.endDate.amount === 0;

                this.startDate = this.buildDate(this.chartOptions.startDate, this.chartOptions.interval, true);
                this.endDate = this.buildDate(this.chartOptions.endDate, this.chartOptions.interval, false);
    
                let path;
                let queryStringParameters = {
                    username: this.$props.username,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    startDate: this.startDate,
                    endDate: this.endDate
                };
    
                switch (this.chartOptions.type) {
                    case "recentWorkouts":
                        path = "/stats/recentworkouts";
                        break;
                    case "exercise":
                        path = "/stats/exercise";

                        if (this.chartOptions.data && this.chartOptions.data.exercise && this.chartOptions.data.exercise.exerciseId) {
                            queryStringParameters.exerciseId = this.chartOptions.data.exercise.exerciseId
                        } else {
                            queryStringParameters.preferenceIndex = this.chartOptions.data.preferenceIndex
                        }

                        if (this.chartOptions.data && this.chartOptions.data.dataToPull) {
                            queryStringParameters.dataToPull = this.chartOptions.data.dataToPull
                        } else {
                            queryStringParameters.dataToPull = "orm"
                        }

                        break;
                    default:
                        throw new Error("Unrecognised chart type: " + this.chartOptions.type);
                }
    
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: queryStringParameters
                }
    
                const response = await API.get(this.$store.state.apiName, path, myInit);
    
                this.isLoading = false;
                this.hasData = true;

                await this.$nextTick(() => { 
                    this.formatData(response);
                });

                this.isUpdating = false;
                this.isSaving = false;
            }
            catch(err) {
                console.error(err)
            }
        },

        formatData(data) {
            try {

                let date = dayjs(this.startDate);
                let nextDate = date.add(1, this.chartOptions.interval);
    
                let dataArr = Object.values(data.data.stats);

                let dataArrKeys = Object.keys(data.data.stats);
    
                // First push an empty array into chartData based on how many bits of data are pushed in in stats.
                // Check if data has been returned.
                let dataReturned = false;
                for (let i = 0; i < dataArr.length; i++) {
                    this.chartData[dataArrKeys[i]] = [];
                    if (!dataReturned && Object.values(dataArr[i]).length) {
                        dataReturned = true;
                    }
                }

                if (!dataReturned) {
                    throw new Error("No data returned");
                }
    
                while (date.isBefore(dayjs(this.endDate))) {
                    this.chartLabels.push(date.toDate());
    
                    dataArr.forEach((dataObj, index) => {
                        let amount = 0;
                        let keys = Object.keys(dataObj);
                        let values = Object.values(dataObj);
    
                        for (let i = 0; i < keys.length; i++) {
                            let keyDate = dayjs(keys[i]);
    
                            if (keyDate.isSameOrAfter(date) && keyDate.isBefore(nextDate)) {
                                if (dataArrKeys[index] === "orm") {
                                    if (values[i] > amount) {
                                        amount = values[i];
                                    }
                                } else {
                                    amount += values[i];
                                }
    
                                // Delete key value from the object.
                                delete dataArr[index][keys[i]]
                            }
                        }
    
                        if (amount) {
                            this.chartData[dataArrKeys[index]].push({ x: date.format("YYYY-MM-DD"), y: amount });
                        }
                    })
    
                    date = date.add(1, this.chartOptions.interval);
                    nextDate = nextDate.add(1, this.chartOptions.interval);
                }
    
    
                if (this.trimLabels) {
                    let startLabels;
                    let endLabels;
                    
                    dataArrKeys.forEach(key => {
                        if (this.chartData[key][0]) {
                            if (!startLabels || dayjs(this.chartData[key][0].x).isBefore(startLabels)) {
                                startLabels = dayjs(this.chartData[key][0].x);
                            }
    
                            if (!endLabels || dayjs(this.chartData[key][this.chartData[key].length - 1].x).isAfter(endLabels)) {
                                endLabels = dayjs(this.chartData[key][this.chartData[key].length - 1].x)
                            }
                        }
                    })

                    this.chartLabels = this.chartLabels.filter(x => {
                        if (dayjs(x).isSameOrAfter(startLabels) && dayjs(x).isSameOrBefore(endLabels)) {
                            return true;
                        }
    
                        return false;
                    })
                }
    
                // Set card title:
                if (this.chartOptions.type === "recentWorkouts") {
                    this.cardTitle = "Recent Workouts";
                } else if (this.chartOptions.type === "exercise") {
                    this.cardTitle = data.data.exerciseName
                }
    
                this.buildChart();
            }
            catch (err) {
                this.hasData = false;
                this.$nextTick(() => { 
                    this.cardHeight = this.$refs.frontCard.offsetHeight + "px" 
                    this.cardBodyHeight = this.$refs.frontCardBody.offsetHeight + "px";
                });

                console.error(err);
            }
        },

        buildChart() {
            Chart.register(...registerables);
            let ctx = this.$el.querySelector(".chart");
            ctx.height = 400;

            let chartType = "bar";

            if (this.chartOptions.type === "exercise") {
                chartType = "line";
            }

            let chartData = {
                labels: this.chartLabels,
                datasets: []
            };

            let chartDataValues = Object.values(this.chartData);
            let chartDataKeys = Object.keys(this.chartData);

            chartDataValues.forEach((dataset, index) => {
                if (dataset.length) {
                    let datasetObject = {
                        label: "",
                        type: chartType,
                        data: dataset,
                        backgroundColor: this.chartOptions.backgroundColor,
                        borderColor: this.chartOptions.borderColor,
                        pointBackgroundColor: this.chartOptions.pointBackgroundColor,
                        yAxisID: "y" + index,
                    };
    
                    switch (chartDataKeys[index]) {
                        case "orm":
                            datasetObject.label = "One Rep Maximum";
                            break;
                        case "totalReps":
                            datasetObject.label = "Total Reps";
                            break;
                        case "totalVolume":
                            datasetObject.label = "Total Volume"
                            break;
                        case "recentWorkouts": 
                            datasetObject.label = "Workouts"
                            break;
                    }
    
                    if (index > 0) {
                        datasetObject.type = "bar";
                    }
    
                    if (datasetObject.type === "line") {
                        datasetObject.lineTension = 0.15;
                    }
    
                    chartData.datasets.push(datasetObject);
                }
            })

            let options = {
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
                            text: () => {
                                if (this.chartOptions.interval === "week") {
                                    return "Week Commencing"
                                } else if (this.chartOptions.interval === "month") {
                                    return "Month"
                                }

                                return "Date"
                            },
                            display: true
                        },
                        time: {
                            unit: "day",
                            displayFormats: {
                                day: () => {
                                    if (this.chartOptions.interval === "month") {
                                        return "MMM"
                                    }

                                    return "MMM dd"
                                }
                            },
                            tooltipFormat: () => {
                                if (this.chartOptions.interval === "month") {
                                    return "MMMM"
                                }

                                return "dd MMM"
                            }
                        },
                        ticks: {
                            source: "labels"
                        }
                    },
                    y0: {
                        type: "linear",
                        display: true,
                        position: "left",
                        ticks: {
                            precision: 0
                        },
                        beginAtZero: true
                    },
                    y1: {
                        type: "linear",
                        display: () => {
                            if (chartData.datasets.length > 1) {
                                return true;
                            }

                            return false;
                        },
                        position: "right",
                        ticks: {
                            precision: 0
                        },
                        beginAtZero: true
                    }
                }
                
            }

            this.chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: options
            });

            // Once chart is built, now set the height of the card.
            this.$nextTick(() => { 
                this.cardHeight = this.$refs.frontCard.offsetHeight + "px" 
                this.cardBodyHeight = this.$refs.frontCardBody.offsetHeight + "px";
            });
        },

        buildDate(dateObj, interval, start) {
            if (!dateObj.date) {
                let date = dayjs().subtract(dateObj.amount, dateObj.unit);

                if (start) {
                    date = date.startOf(interval);
                } else {
                    date = date.endOf(interval);
                }

                if (interval === "week") {
                    date = date.add(1, "day");

                    // Subtract 1 week if end date is today, and today is a Sunday, as dayjs is saying Sunday is first day of week.
                    if (this.endDateToday && dayjs().day() === 0) {
                        date = date.subtract(1, "week");
                    }
                }

                return date.valueOf();
            } else {
                return dayjs(dateObj.date).valueOf();
            }
        },

        flipCard() {
            if (this.$refs.cardFlip.classList.contains("flipped") && this.$el.querySelector(".chart")) {
                this.$el.querySelector(".chart").style.display = "block";
            } else if (!this.$refs.cardFlip.classList.contains("flipped") && !this.hasData) {
                this.cardHeight = "366px" 
                this.cardBodyHeight = "326px"; // Defaults
            }

            this.$refs.cardFlip.classList.toggle("flipped");
        },

        async updateChart(save) {
            this.isLoading = true;

            if (save) {
                this.isSaving = true;
            } else {
                this.isUpdating = true;
            }

            if (this.newStartDateDynamic) {
                this.newChartOptions.startDate.date = null;
            } else {
                this.newChartOptions.startDate.amount = 0;
                this.newChartOptions.startDate.unit = "day"
            }

            if (this.newEndDateDynamic) {
                this.newChartOptions.endDate.date = null;
            } else {
                this.newChartOptions.endDate.amount = 0;
                this.newChartOptions.endDate.unit = "day";
            }

            if (!this.newPreferredExercise && this.selectedExercise.exerciseId) {
                this.newChartData.exercise = this.selectedExercise;
                this.newChartData.preferenceIndex = 0;
            } else {
                this.newChartData.exercise = {};
            }

            // Set data object.
            if (this.newChartOptions.type === "exercise") {
                this.newChartOptions.data = this.newChartData;
            } else {
                this.newChartOptions.data = {};
            }

            if (this.$props.persistent) {
                await this.$store.dispatch("updateChart", {
                    options: this.newChartOptions,
                    position: this.$props.position,
                    index: this.$props.index,
                    save: save
                })
            } else {
                this.$emit("updateChart", this.newChartOptions);
            }

            if (this.chart) {
                this.chart.destroy();
            }

            this.$nextTick(async () => { 
                await this.getData();
                this.$refs.cardFlip.classList.toggle("flipped");
            });
        },

        resetVariables() {
            this.isLoading = true;
            this.hasData = false;
            this.cardTitle = "";
            this.startDate = null;
            this.endDate = null;
            this.trimLabels = false;
            this.newChartOptions = {};
            this.delayed = false;
            this.chartLabels = [];
            this.chartData = {};
            this.chart = null;

            Object.assign(this.chartOptions, this.$props.options);
            Object.assign(this.newChartData, this.chartOptions.data);

            this.newChartOptions = JSON.parse(JSON.stringify(this.chartOptions));
        },

        selectExercise(exercise) {
            this.selectedExercise = exercise;
            delete this.selectedExercise._id;
            this.searchExerciseModal = false;
        }
    }
    
}
</script>

<style scoped>
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

    .back-card-body {
        overflow-y: scroll;
    }
</style>