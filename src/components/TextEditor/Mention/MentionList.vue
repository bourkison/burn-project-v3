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

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
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
            selected: false,
        };
    },

    methods: {
        onKeyDown({ event }: any): boolean {
            if (event.key === "ArrowUp") {
                this.upHandler();
                return true;
            }

            if (event.key === "ArrowDown") {
                this.downHandler();
                return true;
            }

            if (event.key === "Enter" || event.key === "Tab") {
                this.enterHandler();
                return true;
            }

            return false;
        },

        upHandler(): void {
            this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length;
        },

        downHandler(): void {
            this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
        },

        enterHandler(): void {
            this.selectItem(this.selectedIndex);
        },

        selectItem(index: number): void {
            const item = this.items[index];

            if (item && !this.selected) {
                // TODO: Fix position out of line error.
                try {
                    this.command({ id: item });
                    this.selected = true;
                }
                catch (err) {
                    console.error(err);
                }
            }
        },
    },

    watch: {
        items() {
            this.selectedIndex = 0;
        },
    },
});
</script>
