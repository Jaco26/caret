import { Component, ComponentDOM } from './caret/caret.js'

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
<div id="my-class" class="hi hillo" r-if={3 < this.age} r-for={x in [1,2,3]}>

  <div>
    {23 + 98} how are-you 
    <p>
      <h1>What?</h1>
      How re you? {this.name + this.name}
    </p>
    hello
  </div>

  <SomeChild id class="Hello" @click={this.onClick} /> 
  <input @input={this.onInput} />
  Hiiii
</div>
  `
})


const preTemplate = document.createElement('pre')
preTemplate.textContent = Root.template

const dom = new ComponentDOM(Root, document.getElementById('app'))

dom.render({
  name: 'jaconb',
  onInput(e) {
    console.log(e.target.value)
    console.log(this.name)
  }
})

document.getElementById('app').append(preTemplate)