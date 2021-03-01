import { randId } from './utils.js'

const LEFT_CARET = 'LEFT_CARET'
const RIGHT_CARET = 'RIGHT_CARET'
const FORWARD_SLASH = 'FORWARD_SLASH'
const LEFT_BRAKET = 'LEFT_BRAKET'
const RIGHT_BRACKET = 'RIGHT_BRACKET'
const QUOTE = 'QUOTE'
const EQUALS = 'EQUALS'
const SPACE = 'SPACE'
const LITERAL = 'LITERAL'
const AT = 'AT'
const STRING = 'STRING'
const EXPRESSION = 'EXPRESSION'
const IDENTIFIER = 'IDENTIFIER'
const WORD = 'WORD'
const CHILD_COMPONENT = 'CHILD_COMPONENT'

const CLASS = 'CLASS'
const ID = 'ID'
const DISABLED = 'DISABLED'
const R_FOR = 'R_FOR'
const R_IF = 'R_IF'


const directives = {
  'r-for': R_FOR,
  'r-if': R_IF
}

const attributes = {
  'class': CLASS,
  'id': ID,
  'disabled': DISABLED,
}

const keywords = {
  ...directives,
  ...attributes,
}


/**
 * 
 * @typedef Token
 * @property {string} type
 * @property {string} text
 */


/**
 * 
 * @param {string} htmlString 
 */
export const scanTemplate = htmlString => {
  htmlString = htmlString.trim()

  const lex = char => {
    const specialChars = {
      '<': LEFT_CARET,
      '>': RIGHT_CARET,
      '{': LEFT_BRAKET,
      '}': RIGHT_BRACKET,
      '/': FORWARD_SLASH,
      '"': QUOTE,
      '=': EQUALS,
      '@': AT,
      ' ': SPACE,
    }
    return specialChars[char] || LITERAL
  }

  /** @type {Token[]} */
  const tokens = []
  let current = 0
  let start = 0

  function scanTokens() {
    const char = advance()
    const type = lex(char)
    switch (type) {
      case QUOTE:
        dynamicLength(STRING, '"')
        break
      case LEFT_BRAKET:
        dynamicLength(EXPRESSION, '}')
        break
      case SPACE:
        if (lookAhead() === ' ') {
          break
        }
      default:
        if (isAlphaNumeric(char)) {
          identifier()
        } else if (char !== '\n') {
          addToken(type, type === LITERAL ? char : null)
        }
    }
  }

  function dynamicLength(type, terminator) {
    while (peek() !== terminator && !isAtEnd()) {
      advance()
    }
    advance()
    addToken(type, htmlString.slice(start + 1, current - 1))
  }

  function identifier() {
    while (isAlphaNumeric(peek())) {
      advance()
    }
    const text = htmlString.slice(start, current)
    const isTextNode = () => {
      const types = tokens.map(t => t.type)
      return types.lastIndexOf(RIGHT_CARET) > types.lastIndexOf(LEFT_CARET)
    }
    // let type = keywords[text]
    //   ? keywords[text]
    //   : isTextNode()
    //     ? WORD
    //     : IDENTIFIER
    const type = isTextNode() ? WORD : IDENTIFIER
    addToken(type)
  }

  function advance() {
    current += 1
    return htmlString[current - 1]
  }

  function peek() {
    if (isAtEnd()) return
    return htmlString[current]
  }

  function lookAhead() {
    if (isAtEnd()) return
    return htmlString[current + 1]
  }

  function addToken(type, literal) {
    tokens.push({ type, text: literal || htmlString.slice(start, current)})
  }

  function isAlphaNumeric(char) {
    return /\w|-/.test(char)
  }

  function isAtEnd() {
    return current >= htmlString.length
  }

  while (!isAtEnd()) {
    // We are at the beginning of the next lexeme.
    start = current
    scanTokens()
  }

  return tokens
}



/**
 * 
 * @param {Token[]} tokens 
 */
function parseAttributes(tokens) {

  const rv =  {
    attributes: {},
    directives: {},
    listeners: {},
    tagName: '',
  }

  let current = 0

  function scanTokens() {
    const { type, text } = advance()
    switch (type) {
      case LEFT_CARET:
        scanTagName()
        break
      case AT:
        scanListener()
        break
      case IDENTIFIER:
        scanAttribute()
        break
    }
  }

  function scanTagName() {
    rv.tagName = advance().text
  }

  function scanListener() {
    const eventName = advance().text
    advance() // consume the =
    const listener = advance()
    if (listener.type !== EXPRESSION) {
      throw new Error('Listener must be expression')
    }
    rv.listeners[eventName] = new Function('event', `${listener.text}(event)`)
  }

  function scanAttribute() {
    const identifier = lookBehind()
    const loc = directives[identifier.text]
      ? 'directives'
      : 'attributes'
    if (peek().type === EQUALS) {
      advance() // consume the =
      const { type, text } = advance()
      rv[loc][identifier.text] = type === STRING
        ? text
        : new Function(`return ${text}`)
    } else {
      rv[loc][identifier.text] = true
    }
  }

  function advance() {
    current += 1
    return tokens[current - 1]
  }

  function peek(delta) {
    if (isAtEnd()) return
    return tokens[delta || current]
  }

  function lookAhead() {
    return peek(current + 1)
  }

  function lookBehind() {
    if (current <= 0) return
    return peek(current - 1)
  }

  function isAtEnd() {
    return current >= tokens.length
  }

  while (!isAtEnd()) {
    scanTokens()
  }



  return rv
}



class ASTTagNode {
  constructor() {
    /** @type {Token[]} */
    this.tokens = []
  }

  get tagName() {
    return this.tokens[this.kind === 'CLOSING' ? 2 : 1].text
  }

  get kind() {
    if (this.tokens[1].type === FORWARD_SLASH) {
      return 'CLOSING'
    } else if (this.tokens[this.tokens.length - 2].type === FORWARD_SLASH) {
      return 'SELF_CLOSING'
    } else {
      return 'OPENING'
    }
  }
}

class ASTTextNode {
  constructor() {
    /** @type {Token[]} */
    this.tokens = []
  }
}

class ASTExprNode {
  constructor() {
    /** @type {Token[]} */
    this.tokens = []
  }
}


export class AST {
  /**
   * 
   * @param {Token[]} tokens 
   */
  constructor(tokens) {
    this.nodes = this.parseTree(tokens) 
  }


  /**
   * 
   * @param {Token[]} tokens 
   */
  flatNodes(tokens) {
    const rv = []

    const initNode = (index) => {
      switch (tokens[index].type) {
        case LEFT_CARET: return new ASTTagNode()
        case EXPRESSION: return new ASTExprNode()
        case SPACE: return initNode(index + 1)
        default: return new ASTTextNode()
      }
    }

    const helper = (index) => {
      if (index >= tokens.length) return

      const node = initNode(index)

      for (let i = index; i < tokens.length; i++) {
        const { type, text } = tokens[i]

        if (type === SPACE) {
          continue
        }

        if (node.constructor === ASTTagNode) {
          if (type === RIGHT_CARET) {
            node.tokens.push({ i, type, text })
            rv.push(node)
            return helper(i + 1)
          } else {
            node.tokens.push({ i, type, text })
          }
        }

        else if (node.constructor === ASTTextNode) {
          if (type === LEFT_CARET || type === EXPRESSION) {
            rv.push(node)
            return helper(i)
          } else {
            node.tokens.push({ i, type, text })
          }
        }

        else if (node.constructor === ASTExprNode) {
          node.tokens.push({ i, type, text })
          rv.push(node)
          return helper(i + 1)
        }
      }
    }

    helper(0)

    return rv
  }

  /**
   * 
   * @param {Token[]} tokens 
   */
  parseTree(tokens) {
    const traverse = (nodes) => {
      const treeNode = { type: '', tag: '', children: [] }
      while (nodes.length) {
        const node = nodes.shift()

        if (node.constructor === ASTTagNode) {
          if (node.kind === 'CLOSING') {
            return treeNode
          }
          else if (node.kind === 'OPENING') {
            // parse attributes
            const {
              attributes,
              directives,
              listeners,
              tagName } = parseAttributes(node.tokens)
            treeNode.tag = tagName
            treeNode.type = 'ELEM'
            treeNode.attributes = attributes
            treeNode.directives = directives
            treeNode.listeners = listeners
            const children = traverse(nodes)
            // and then...
            children.tag = treeNode.tag
            children.type = treeNode.type
            treeNode.children.push(children)
          }
          else if (node.kind === 'SELF_CLOSING') {
            // parse attributes
            const {
              attributes,
              directives,
              listeners,
              tagName } = parseAttributes(node.tokens)
            // and then...
            treeNode.children.push({
              type: 'ELEM',
              tag: tagName,
              attributes,
              directives,
              listeners,
            })
          }
        }
        else if (
          node.constructor === ASTTextNode ||
          node.constructor === ASTExprNode
        ) {
          const isText = node.constructor === ASTTextNode
          const value = node.tokens.map(t => t.text).join(' ')
          treeNode.children.push({
            type: isText ? 'TEXT' : 'EXP',
            value: isText ? value : new Function(`return ${value}`)
          })
        }

      }
      return treeNode
    }
    return traverse(this.flatNodes(tokens))
  }
}

/**
 * 
 * @param {string} htmlString 
 */
export function parse(htmlString) {
  const tokens = scanTemplate(htmlString)
  return new AST(tokens)
}