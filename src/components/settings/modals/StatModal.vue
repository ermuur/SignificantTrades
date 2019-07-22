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
        {{ context.period }}
      </div>
      <div class="modal-footer">

      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import mixin from './modal'

console.log(mixin)

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
