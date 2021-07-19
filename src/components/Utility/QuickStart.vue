<template>
    <div>
        <b-card no-body class="no-bot-border bbr-0">
            <b-card-body class="pb-1">
                <b-card-title><h6>Quick Start</h6></b-card-title>
            </b-card-body>
        </b-card>
        <div>
            <b-list-group>
                <b-list-group-item to="/workout/new" class="s-font d-flex btr-0 align-items">
                    <div>New Workout</div>
                    <div class="ml-auto"><b-icon-plus /></div>
                </b-list-group-item>
                <b-list-group-item v-for="workout in recentWorkouts" :key="workout.id" :to="'/workout/new?b=' + workout.id" class="s-font d-flex align-items">
                    <div>{{ workout.name }}</div>
                    <div class="ml-auto text-muted xs-font">{{ workout.createdAtText }}</div>
                </b-list-group-item>
            </b-list-group>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

export default {
    name: 'QuickStart',
    data() {
        return {
            workoutsLoadedIn: 3,
            recentWorkouts: [],
        }
    },

    created: async function() {
        dayjs.extend(relativeTime);

        if (this.$store.state.userWorkouts === null) {
            await this.$store.dispatch('fetchWorkouts', this.$store.state.userProfile.data).catch(e => { console.error(e) });
        }

        let uniqueNames = [];
        let i = 0;
        let j = 0;

        while (i < this.workoutsLoadedIn && j < this.$store.state.userWorkouts.length) {
            if (!uniqueNames.includes(this.$store.state.userWorkouts[j].name)) {
                let temp = this.$store.state.userWorkouts[j];
                temp.createdAtText = dayjs(dayjs.unix(temp.createdAt.seconds)).fromNow();
                this.recentWorkouts.push(temp);
                i ++;
            }

            j ++;
        }
    }
}
</script>

<style scoped>
.s-font {
    font-size: 14px;
}

.xs-font {
    font-size: 10px;
}

.btr-0 {
    border-top-left-radius: 0 !important;
    border-top-right-radius: 0 !important;
}

.bbr-0 {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

.no-bot-border { 
    border-bottom: none !important;
}

.align-items {
    align-items: center;
}
</style>