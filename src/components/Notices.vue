<template>
  <div class="notices">
    <div
      v-for="(notice, index) in notices"
      class="notice"
      :key="notice.id"
      :class="'notice--' + notice.type"
      @click="
        notice.click ? notice.click(notice) && dismiss(index) : dismiss(index)
      "
    >
      <span class="notice__icon icon-"></span>
      <div class="notice__title">{{ notice.title }}</div>
      <div
        v-if="notice.message"
        class="notice__message"
        v-html="notice.message"
      ></div>
    </div>
  </div>
</template>

<script>
import socket from '../services/socket'

export default {
  data() {
    return {
      notices: [],
    }
  },
  created() {
    socket.$on('notice', (notice) => {
      if (notice === 'clear') {
        this.notices.splice(0, this.notices.length)
        return
      }

      if (notice.id) {
        for (let _notice of this.notices) {
          if (_notice.id === notice.id) {
            this.notices.splice(this.notices.indexOf(_notice), 1)

            break
          }
        }
      } else {
        notice.id = Math.random()
          .toString(36)
          .substring(7)
      }

      notice.timestamp = +new Date()

      if (!notice.title) {
        notice.title = notice.message

        delete notice.message
      }

      if (!notice.title && !notice.message) {
        return
      }

      if (notice.message) {
        notice.message = notice.message.trim().replace(/\n/, '<br>')
      }

      this.notices.push(notice)

      if (notice.type !== 'error') {
        setTimeout(() => {
          this.dismiss(this.notices.indexOf(notice))
        }, notice.delay || 1000 * 30)
      }
    })
  },
  methods: {
    dismiss(index) {
      this.notices.splice(index, 1)
    },
  },
}
</script>

<style lang="scss">
@import '../assets/sass/variables';

.notices {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5;
  display: flex;
  margin: 20px;
  flex-direction: column;
  flex-wrap: wrap;
  pointer-events: none;
}

.notice {
  display: flex;
  color: white;
  cursor: pointer;
  flex-wrap: wrap;
  padding: 8px 10px;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05), 0 5px 20px rgba(0, 0, 0, 0.1);
  width: auto;
  flex-grow: 0;
  flex-basis: auto;
  margin-right: auto;
  margin-bottom: 10px;
  pointer-events: all;

  > .notice__message {
    flex-basis: 100%;
    font-size: 70%;
    margin: 5px 0 0;
    line-height: 1.4;
  }

  > .notice__title {
    flex-grow: 1;
  }

  > .notice__icon {
    flex-basis: auto;
    margin-right: 5px;
    font-size: 18px;
  }

  &.notice--error {
    background-color: $red;

    .notice__icon:before {
      content: unicode($icon-cross);
    }
  }

  &.notice--warning {
    background-color: $orange;

    .notice__icon:before {
      content: unicode($icon-warning);
    }
  }

  &.notice--success {
    background-color: $green;

    .notice__icon:before {
      content: unicode($icon-check);
    }
  }

  &.notice--info {
    background-color: $blue;

    .notice__icon:before {
      content: unicode($icon-info);
    }
  }
}
</style>
