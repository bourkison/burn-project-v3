<template>
    <div class="items">
        <b-card no-body v-if="isLoadingMentions || items.length">
            <div v-if="!isLoadingMentions">
                <b-list-group>
                    <b-list-group-item
                        v-for="(item, index) in items"
                        :class="{ 'is-selected': index === selectedIndex }"
                        :key="index"
                        @click="selectItem(index)"
                        to="#"
                    >
                        {{ item }}
                    </b-list-group-item>
                </b-list-group>
            </div>
            <div v-else class="text-center">
                <b-list-group>
                    <b-list-group-item class="text-center"><b-spinner small /></b-list-group-item>
                </b-list-group>
            </div>
        </b-card>
    </div>
</template>

<script>
export default {
    name: "MentionList",
    props: {
        items: {
            type: Array,
            required: true,
        },
        command: {
            type: Function,
            required: true,
        },
        isLoadingMentions: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            selectedIndex: 0,
        };
    },

    methods: {
        onKeyDown({ event }) {
            if (event.key === "ArrowUp") {
                this.upHandler();
                return true;
            }

            if (event.key === "ArrowDown") {
                this.downHandler();
                return true;
            }

            if (event.key === "Enter") {
                this.enterHandler();
                return true;
            }

            return false;
        },

        upHandler() {
            this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length;
        },

        downHandler() {
            this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
        },

        enterHandler() {
            this.selectItem(this.selectedIndex);
        },

        selectItem(index) {
            const item = this.items[index];

            if (item) {
                this.command({ id: item });
            }
        },
    },

    watch: {
        items() {
            this.selectedIndex = 0;
        },
    },
};
</script>
