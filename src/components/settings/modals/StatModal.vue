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
            <input type="text" class="form-control" :value="context.name">
          </div>
          <div class="form-group">
            <label for="">Period (min)</label>
            <input type="text" class="form-control" :value="context.period / 60 / 1000">
          </div>
        </div>
        <div class="form-group">
          <label for="">Value</label>
          <textarea class="form-control" rows="3" :value="context.output"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn -red"><i class="icon-cross"></i> remove</button>
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
