import React, { Component, CanvasHTMLAttributes } from 'react'
import Confetti, { IConfettiOptions, confettiDefaults } from './Confetti'

const ref = React.createRef<HTMLCanvasElement>()

export type Props = Partial<IConfettiOptions> & CanvasHTMLAttributes<HTMLCanvasElement> & { canvasRef?: React.Ref<HTMLCanvasElement> }

class ReactConfettiInternal extends Component<Props> {
  static readonly defaultProps = {
    ...confettiDefaults,
  }

  static readonly displayName = 'ReactConfetti'

  constructor(props: Props, ...rest: any[]) {
    super(props, ...rest)
    this.canvas = props.canvasRef as React.RefObject<HTMLCanvasElement> || ref
  }

  canvas: React.RefObject<HTMLCanvasElement> = React.createRef()

  confetti?: Confetti

  componentDidMount() {
    if(this.canvas.current) {
      const opts = extractCanvasProps(this.props)[0]
      this.confetti = new Confetti(this.canvas.current, opts)
    }
  }

  componentDidUpdate() {
    const confettiOptions = extractCanvasProps(this.props)[0]
    if(this.confetti) {
      this.confetti.options = confettiOptions as IConfettiOptions
    }
  }

  componentWillUnmount() {
    if(this.confetti) {
      this.confetti.stop()
    }
    this.confetti = undefined
  }

  render() {
    const [confettiOptions, passedProps] = extractCanvasProps(this.props)
    const canvasStyles = {
      zIndex: 2,
      position: 'absolute' as 'absolute',
      pointerEvents: 'none' as 'none',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      ...passedProps.style,
    }
    return (
      <canvas
        width={confettiOptions.width}
        height={confettiOptions.height}
        ref={this.canvas}
        {...passedProps}
        style={canvasStyles}
      />
    )
  }
}

interface Refs {
  [key: string]: React.Ref<HTMLElement>
}
function extractCanvasProps(props: Partial<IConfettiOptions> | any): [Partial<IConfettiOptions>, Partial<CanvasHTMLAttributes<HTMLCanvasElement>>, Refs] {
  const confettiOptions: Partial<IConfettiOptions> = {}
  const refs: Refs = {}
  const rest: any = {}
  const confettiOptionKeys = [...Object.keys(confettiDefaults), 'confettiSource', 'drawShape', 'onConfettiComplete']
  const refProps = ['canvasRef']
  for(const prop in props) {
    const val = props[prop as string]
    if(confettiOptionKeys.includes(prop)) {
      confettiOptions[prop as keyof IConfettiOptions] = val
    } else if(refProps.includes(prop)) {
      refProps[prop as any] = val
    } else {
      rest[prop] = val
    }
  }
  return [confettiOptions, rest, refs]
}

export const ReactConfetti = React.forwardRef<HTMLCanvasElement, Props>((props, ref) => (
  <ReactConfettiInternal canvasRef={ref} {...props} />
))

export default ReactConfetti
