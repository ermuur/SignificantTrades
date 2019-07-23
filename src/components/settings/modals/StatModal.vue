<template>
  <div class="modal stat-modal">
    <div class="modal__wrapper">
      <div class="modal-header">
        <div class="modal-header__title">
          Custom counter<br><code>{{ context.name.toUpperCase() }}</code>
        </div>
        <div class="modal-header__actions">
          <button @click="close"><i class="icon-cross"></i></button>
        </div>
      </div>
      <div class="modal-content">
        <div class="column">
          <div class="form-group mb8">
            <label for="">Name</label>
            <input type="text" class="form-control" :value="context.name" @change="$store.dispatch('settings/updateStat', {
              index: contextId,
              prop: 'name',
              value: $event.target.value
            })">
          </div>
          <div class="form-group">
            <label for="">Period (min)</label>
            <input type="text" class="form-control" :value="context.period / 60 / 1000" @change="$store.dispatch('settings/updateStat', {
              index: contextId,
              prop: 'period',
              value: $event.target.value
            })">
          </div>
        </div>
        <div class="form-group">
          <label for="">Value</label>
          <textarea class="form-control" rows="3" :value="context.output" @change="$store.dispatch('settings/updateStat', {
            index: contextId,
            prop: 'output',
            value: $event.target.value
          })"></textarea>
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
        <button class="btn -red -small" @click="$store.commit('settings/REMOVE_STAT', contextId), close()"><i class="icon-cross mr4"></i> remove</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import mixin from './modal'

export default {
  mixins: [mixin],
  computed: {
    ...mapState('app', ['statModalId']),
    context() {
      return this.$store.state.settings.statsCounters[this.$store.state.app.statModalId]
    },
  },
}
</script>

<style lang="scss">
@import '../../../assets/sass/variables';

.stat-modal {

}

</style>
