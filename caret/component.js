import { parse } from './template-parser.js'

export class Component {
  constructor({ data, children, computed, methods, props, template, watch }) {
    this.ast = parse(template)
    this.children = children
    this.ctx = { ...data, ...computed, ...methods }
    this.template = template
  }
}