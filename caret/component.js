import { parse } from './template-parser.js'

export class Component {
  constructor({ data, computed, methods, props, template, watch }) {
    this.template = template
    this.ast = parse(template)
  }
}