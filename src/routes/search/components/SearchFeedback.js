// @flow

import * as React from 'react'
import FeedbackModal from '../../feedback/components/FeedbackModal'
import styled from 'styled-components'
import CleanLink from '../../../modules/common/components/CleanLink'
import { NEGATIVE_RATING } from '../../../modules/endpoint/FeedbackEndpoint'
import { translate } from 'react-i18next'
import type { TFunction } from 'react-i18next'
import CityModel from '../../../modules/endpoint/models/CityModel'
import type { LocationState } from 'redux-first-router'
import { goToFeedback } from '../../../modules/app/routes/feedback'
import NothingFoundFeedbackBox from './NothingFoundFeedbackBox'

const FeedbackButton = styled.div`
  padding: 30px 0;
  text-align: center;
`

const FeedbackLink = styled(CleanLink)`
  padding: 5px 20px;
  background-color: ${props => props.theme.colors.themeColor};
  color: ${props => props.theme.colors.backgroundAccentColor};
  border-radius: 0.25em;
`

const FeedbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

type PropsType = {
  cities: Array<CityModel>,
  location: LocationState,
  query: string,
  resultsFound: boolean,
  t: TFunction
}

export class SearchFeedback extends React.Component<PropsType> {
  renderFeedbackOption (): React.Node {
    const {resultsFound, query, location, t} = this.props
    if (!resultsFound) {
      return (
        <FeedbackContainer>
          <div>{t('nothingFound')}</div>
          <NothingFoundFeedbackBox location={location} query={query} />
        </FeedbackContainer>
      )
    } else if (query) {
      return (
        <FeedbackButton>
          <FeedbackLink to={goToFeedback(location, NEGATIVE_RATING)}>{t('informationNotFound')}</FeedbackLink>
        </FeedbackButton>
      )
    }
  }

  render () {
    const {query, cities, t, location} = this.props
    const feedbackStatus = location.query && location.query.feedback

    return (
      <>
        {this.renderFeedbackOption()}
        <FeedbackModal
          query={query}
          cities={cities}
          location={location}
          feedbackType={feedbackStatus}
          commentMessage={t('wantedInformation')} />
      </>
    )
  }
}

export default translate('feedback')(SearchFeedback)
