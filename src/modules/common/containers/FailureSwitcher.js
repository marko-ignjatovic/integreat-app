// @flow

import * as React from 'react'
import ContentNotFoundError from '../errors/ContentNotFoundError'
import Failure from '../components/Failure'
import LanguageFailure from './LanguageFailure'
import { goToEvents } from '../../app/routes/events'
import { goToExtras } from '../../app/routes/extras'
import { goToCategories } from '../../app/routes/categories'
import LanguageNotFoundError from '../../app/errors/LanguageNotFoundError'

type Props = {
  error: Error
}

export class FailureSwitcher extends React.Component<Props> {
  /**
   * Renders a Failure with a link to the "home" of the route and information about what was not found
   * @param error
   * @return {*}
   */
  static renderContentNotFoundComponent (error: ContentNotFoundError): React.Node {
    switch (error.type) {
      case 'category':
        return <Failure goToAction={goToCategories(error.city, error.language)}
                        goToMessage={'categories'}
                        errorMessage={`There is no category with the path ${error.id}.`} />
      case 'event':
        return <Failure goToAction={goToEvents(error.city, error.language)}
                        goToMessage={'events'}
                        errorMessage={`There is no event with the id ${error.id}.`} />
      case 'extra':
        return <Failure goTo={goToExtras(error.city, error.language)}
                        goToMessage={'extras'}
                        errorMessage={`There is no extra with the name ${error.id}.`} />
    }
  }

  /**
   * Decides which kind of error should be rendered
   * @return {*}
   */
  renderErrorComponent (): React.Node {
    const error = this.props.error
    if (error instanceof ContentNotFoundError) {
      return FailureSwitcher.renderContentNotFoundComponent(error)
    } else if (error instanceof LanguageNotFoundError) {
      return <LanguageFailure city={error.city} language={error.language} />
    } else {
      return <Failure errorMessage={error.message} />
    }
  }

  render () {
    return this.renderErrorComponent()
  }
}

export default FailureSwitcher
