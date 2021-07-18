<template>
    <div>
        <b-card no-body class="no-bot-border bbr-0">
            <b-card-body class="pb-1">
                <b-card-title><h6>Quick Start</h6></b-card-title>
            </b-card-body>
        </b-card>
        <div>
            <b-list-group>
                <b-list-group-item to="/burn/new" class="s-font d-flex btr-0 align-items">
                    <div>New Burn</div>
                    <div class="ml-auto"><b-icon-plus /></div>
                </b-list-group-item>
                <b-list-group-item v-for="burn in recentBurns" :key="burn.id" :to="'/burn/new?b=' + burn.id" class="s-font d-flex align-items">
                    <div>{{ burn.name }}</div>
                    <div class="ml-auto text-muted xs-font">{{ burn.createdAtText }}</div>
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
            burnsLoadedIn: 3,
            recentBurns: [],
        }
    },

    created: async function() {
        dayjs.extend(relativeTime);

        if (this.$store.state.userBurns === null) {
            await this.$store.dispatch('fetchBurns', this.$store.state.userProfile.data).catch(e => { console.error(e) });
        }

        let uniqueNames = [];
        let i = 0;
        let j = 0;

        while (i < this.burnsLoadedIn && j < this.$store.state.userBurns.length) {
            if (!uniqueNames.includes(this.$store.state.userBurns[j].name)) {
                let temp = this.$store.state.userBurns[j];
                temp.createdAtText = dayjs(dayjs.unix(temp.createdAt.seconds)).fromNow();
                this.recentBurns.push(temp);
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