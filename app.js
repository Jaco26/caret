import { Component } from './caret/caret.js'

// const SomeChild = new Component({
//   template: '<span>I am a child!</span>'
// })

const Root = new Component({
  children: {
    // SomeChild
  },
  data: {
    name: 'nndsd'
  },
  props: ['isDarkMode'],
  template: `
    <div class="hi hillo" r-if={3 < this.age} r-for={x in [1,2,3]}>
      <div>
        {this.name + 98} how are-you 
      </div>
      <SomeChild @click={this.onClick} /> 
      <input @input={e => this.name = e.target.value} />
      Hiiii
    </div>
  `
})

const preTemplate = document.createElement('pre')
preTemplate.textContent = Root.template
const preAst = document.createElement('pre')
preAst.textContent = JSON.stringify(Root.ast, null, 2)

document.querySelector('#app').append(preTemplate)
document.querySelector('#app').append(preAst)
