<template>
  <div class="modal stat-modal">
    <div class="modal__wrapper">
      <div class="modal-header">
        <div class="modal-header__title">
          Custom counter
          <br />
          <code>{{ context.name.toUpperCase() }}</code>
        </div>
        <div class="modal-header__actions">
          <button @click="close">
            <i class="icon-cross"></i>
          </button>
        </div>
      </div>
      <div class="modal-content">
        <div class="column">
          <div class="form-group mb8">
            <label>Name</label>
            <input
              type="text"
              class="form-control"
              :value="context.name"
              @change="$store.dispatch('settings/updateStat', {
              index: contextId,
              prop: 'name',
              value: $event.target.value
            })"
            />
          </div>
          <div class="form-group" ref="colorContainer">
            <label>Color</label>
            <input
              type="text"
              class="form-control"
              :value="context.color"
              :style="{ backgroundColor: context.color }"
              @click="togglePicker"
            />
            <chrome-picker
              v-if="showPicker"
              ref="picker"
              :value="context.color"
              @input="updateColor"
            ></chrome-picker>
          </div>
        </div>
        <div class="column">
          <div class="form-group mb8">
            <label>Period</label>
            <input type="text" class="form-control" :placeholder="(statsPeriod / 1000 / 60) + 'm'" :value="period" @change="$store.dispatch('settings/updateStat', {
              index: contextId,
              prop: 'period',
              value: $event.target.value
            })">
          </div>
          <div class="form-group mb8">
            <label>Smoothing</label>
            <input
              type="text"
              class="form-control"
              placeholder="no smoothing"
              :value="context.smoothing"
              @change="$store.dispatch('settings/updateStat', {
              index: contextId,
              prop: 'smoothing',
              value: $event.target.value
            })"
            />
          </div>
          <div class="form-group mb8">
            <label>Precision</label>
            <input
              type="text"
              class="form-control"
              placeholder="auto"
              :value="context.precision"
              @change="$store.dispatch('settings/updateStat', {
              index: contextId,
              prop: 'precision',
              value: $event.target.value
            })"
            />
          </div>
        </div>
        <div class="form-group">
          <label for>Value</label>
          <textarea
            class="form-control"
            rows="5"
            :value="context.output"
            @change="$store.dispatch('settings/updateStat', {
            index: contextId,
            prop: 'output',
            value: $event.target.value
          })"
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <label class="checkbox-control flex-left">
          <input
            type="checkbox"
            class="form-control"
            :checked="context.enabled"
            @change="$store.dispatch('settings/updateStat', { index: contextId, prop: 'enabled', value: $event.target.checked })"
          />
          <div></div>
          <span>{{ context.enabled ? 'Enabled' : 'Disabled' }}</span>
        </label>
        <button
          class="btn -red -small"
          @click="$store.commit('settings/REMOVE_STAT', contextId), close()"
        >
          <i class="icon-cross mr4"></i> remove
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import { Chrome } from 'vue-color'

import mixin from './modal'

export default {
  components: {
    'chrome-picker': Chrome,
  },
  mixins: [mixin],
  data() {
    return {
      showPicker: false,
    }
  },
  computed: {
    ...mapState('app', ['statModalId']),
    ...mapState('settings', ['statsPeriod']),
    context() {
      return this.$store.state.settings.statsCounters[
        this.$store.state.app.statModalId
      ]
    },
    period() {
      return this.context.period ? this.context.period / 1000 / 60 : null
    }
  },
  methods: {
    togglePicker() {
      this.showPicker = true

      this._onClickOutside = (event => {
        if (event.target !== this.$refs.colorContainer && !this.$refs.colorContainer.contains(event.target)) {
          document.removeEventListener('click', this._onClickOutside);

          this.showPicker = false
        }
      }).bind(this)

      document.addEventListener('click', this._onClickOutside);
    },
    updateColor(color, delay = 100) {
      clearTimeout(this._updateColorTimeout)

      this._updateColorTimeout = window.setTimeout(() => {
        this.$store.dispatch('settings/updateStat', {
          index: this.contextId,
          prop: 'color',
          value: color.hex,
        })
      }, delay)
    },
  },
}
</script>

<style lang="scss">
@import '../../../assets/sass/variables';

.stat-modal .modal__wrapper {
  width: 400px;

  .vc-chrome {
    position: relative;
    width: 100%;
    height: 100px;
    margin-top: 8px;
    animation: picker-in .2s $easeOutExpo;

    .vc-chrome-saturation-wrap {
      border-radius: 2px;
    }

    .vc-chrome-fields-wrap {
      display: none;
    }
  }
}
</style>
