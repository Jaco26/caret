import { Component } from './component.js'


export class ComponentDOM {
  /**
   * 
   * @param {Component} root 
   * @param {HTMLElement} elem
   */
  constructor(root, elem) {
    this.elem = elem
    this.root = root
  }

  render(ctx) {
    const visitChildrenOf = (node) => {
      switch (node.type) {
        case 'ELEM':
          console.log(node.tag)
          const elem = document.createElement(node.tag)
          Object.keys(node.listeners || {}).forEach(key => {
            elem.addEventListener(key, node.listeners[key].bind(ctx))
          })
          Object.keys(node.attributes || {}).forEach(key => {
            const value = node.attributes[key]
            elem.setAttribute(key, typeof value === 'function' ? value.call(ctx) : value)
          })
          if (node.children) {
            node.children.forEach(child => {
              elem.append(visitChildrenOf(child))
            })
          }
          return elem
        case 'EXP':
          const span = document.createElement('span')
          span.textContent = node.value.call(ctx)
          return span
        case 'TEXT':
          return node.value
      }
    }

    console.log(this.root.ast.nodes)
    this.elem.append(visitChildrenOf(this.root.ast.nodes))
  }
}