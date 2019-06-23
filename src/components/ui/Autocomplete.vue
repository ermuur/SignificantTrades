<template>
  <div class="autocomplete">
    <div class="autocomplete__wrapper">
      <div
        class="autocomplete__item"
        v-for="(value, index) in items"
        :key="index"
        @click="removeItem(index)"
        v-text="value"
      ></div>
      <div
        ref="input"
        class="autocomplete__input"
        contenteditable
        :placeholder="placeholder"
        @focus="open"
        @input="search($event.target.innerText)"
        @keydown="handleKeydown"
      ></div>
    </div>
    <div class="autocomplete__dropdown" v-show="isOpen">
      <div
        class="autocomplete__option"
        v-for="(value, index) in filteredOptions"
        :key="index"
        @click="addItem(index)"
        v-text="value"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    placeholder: {
      type: String,
      default: "Type something..."
    },
    load: {
      type: Function
    }
  },

  data() {
    return {
      isOpen: false,
      activeOptionIndex: null,
      items: [],
      options: []
    }
  },

  computed: {
    filteredOptions() {
      return this.options.filter(a => this.items.indexOf(a) === -1)
    }
  },

  created() {},

  methods: {
    search(query) {
      this.activeOptionIndex = null

      if (!this.load) {
        return
      }

      if (Array.isArray(this.load)) {
        this.options = this.load.filter(a => a.indexOf(query) !== -1)
      } else if (typeof this.load === "function") {
        this.options = this.load(query)
      }

      if (!this.options) {
        this.options = []
      }

      this.options.splice(50, this.options.length)

      if (!this.options.length) {
        this.close()
      } else {
        this.open()
      }
    },

    open() {
      if (this.isOpen || !this.options.length) {
        return
      }
      console.log('open')

      this.isOpen = true

      this.bindClose()
    },

    close() {
      if (!this.isOpen) {
        return
      }

      console.log('close')

      this.isOpen = false

      this.bindClose(true)
    },

    bindClose(unbind = false) {
      if (typeof this["_bindCloseHandler"] !== "undefined") {
        if (unbind) {
          document.removeEventListener(
            this.$root.isTouchSupported ? "touchdown" : "mousedown",
            this["_bindCloseHandler"],
            false
          )
        }

        delete this["_bindCloseHandler"]

        return
      }

      this["_bindCloseHandler"] = event => {
        if (event.target === this.$el || this.$el.contains(event.target)) {
          return
        }

        this.close()
      }

      document.addEventListener(
        this.$root.isTouchSupported ? "touchdown" : "mousedown",
        this["_bindCloseHandler"],
        false
      )
    },

    addItem(index) {
      const value = this.options[index]

      if (!value || this.items.indexOf(value) !== -1) {
        return
      }

      this.items.push(value)

      this.$refs.input.innerText = ""
    },

    removeItem(index) {
      this.items.splice(index, 1)
    },

    handleKeydown($event) {
      switch ($event.which) {
        case 13:
          if (this.activeOptionIndex !== null) {
            event.preventDefault()

            this.addItem(this.activeOptionIndex)
          }
          break
        case 8:
          if (this.items.length && !this.$refs.input.innerText.length) {
            this.removeItem(this.items.length - 1)

            event.preventDefault()
          }
          break
        case 38:
        case 40:
          if (this.options.length) {
            if ($event.which === 38) {
              this.activeOptionIndex = Math.max(0, this.activeOptionIndex - 1)
            } else if ($event.which === 40) {
              if (this.activeOptionIndex === null ) {
                this.activeOptionIndex = 0
              } else {
                this.activeOptionIndex = Math.min(this.options.length - 1, this.activeOptionIndex + 1)
              }
            }
          }
          break
      }
    }
    /*
    getCaretPosition(editableDiv) {
      var caretPos = 0, sel, range;
      if (window.getSelection) {
      sel = window.getSelection();
      if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      if (range.commonAncestorContainer.parentNode == editableDiv) {
        caretPos = range.endOffset;
      }
      }
      } else if (document.selection && document.selection.createRange) {
      range = document.selection.createRange();
      if (range.parentElement() == editableDiv) {
      var tempEl = document.createElement("span");
      editableDiv.insertBefore(tempEl, editableDiv.firstChild);
      var tempRange = range.duplicate();
      tempRange.moveToElementText(tempEl);
      tempRange.setEndPoint("EndToEnd", range);
      caretPos = tempRange.text.length;
      }
      }
      return caretPos;
    }
    */
  }
}
</script>