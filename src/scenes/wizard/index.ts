import BaseScene, { SceneOptions } from '../base.ts'
import { Middleware, MiddlewareObj } from '../../middleware.ts'
import WizardContextWizard, { WizardSessionData } from './context.ts'
import Composer from '../../composer.ts'
import Context from '../../context.ts'
import SceneContextScene from '../context.ts'

export class WizardScene<
    C extends Context & {
      scene: SceneContextScene<C, WizardSessionData>
      wizard: WizardContextWizard<C>
    }
  >
  extends BaseScene<C>
  implements MiddlewareObj<C>
{
  steps: Array<Middleware<C>>

  constructor(id: string, ...steps: Array<Middleware<C>>)
  constructor(
    id: string,
    options: SceneOptions<C>,
    ...steps: Array<Middleware<C>>
  )
  constructor(
    id: string,
    options: SceneOptions<C> | Middleware<C>,
    ...steps: Array<Middleware<C>>
  ) {
    let opts: SceneOptions<C> | undefined
    let s: Array<Middleware<C>>
    if (typeof options === 'function' || 'middleware' in options) {
      opts = undefined
      s = [options, ...steps]
    } else {
      opts = options
      s = steps
    }
    super(id, opts)
    this.steps = s
  }

  middleware() {
    return Composer.compose<C>([
      (ctx, next) => {
        ctx.wizard = new WizardContextWizard<C>(ctx, this.steps)
        return next()
      },
      super.middleware(),
      (ctx, next) => {
        if (ctx.wizard.step === undefined) {
          ctx.wizard.selectStep(0)
          return ctx.scene.leave()
        }
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
      },
    ])
  }

  enterMiddleware() {
    return Composer.compose([this.enterHandler, this.middleware()])
  }
}
