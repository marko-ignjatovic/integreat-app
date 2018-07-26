// @flow

import * as React from 'react'
import 'react-dropdown/style.css'

import CityModel from '../../../modules/endpoint/models/CityModel'
import { translate } from 'react-i18next'
import styled from 'styled-components'
import FontAwesome from 'react-fontawesome'
import FeedbackDropdown from './FeedbackDropdown'
import type { FeedbackDropdownType } from './FeedbackDropdown'
import FeedbackEndpoint, { DEFAULT_FEEDBACK_LANGUAGE, INTEGREAT_INSTANCE }
  from '../../../modules/endpoint/FeedbackEndpoint'
import type { TFunction } from 'react-i18next'

const FeedbackBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 350px;
  height: auto;
  box-sizing: border-box;
  border-radius: 10px;
  border-color: #585858;
  font-size: ${props => props.theme.fonts.contentFontSize};
  padding: 20px;
`

const Title = styled.div`
  font-size: ${props => props.theme.fonts.subTitleFontSize};
  padding: 0 0 20px;
`

const Description = styled.div`
  padding: 10px 0 5px;
`

const RatingContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 10px;
  
  & > * {
    font-size: 2rem;
  }
`

const RatingItem = styled(FontAwesome)`
  cursor: pointer;
  color: ${props => props.selected ? props.theme.colors.themeColor : props.theme.colors.textSecondaryColor};
  opacity: ${props => props.selected ? '1.0' : '0.5'}
`

const CommentField = styled.textarea`
  resize: none;
`

const SubmitButton = styled.div`
  margin: 15px 0;
  padding: 5px;
  background-color: ${props => props.theme.colors.themeColor};
  color: ${props => props.theme.colors.backgroundAccentColor};
  text-align: center;
  border-radius: 0.25em;
`

type PropsType = {
  cities: Array<CityModel>,
  city: string,
  language: string,
  id?: number,
  title: string,
  alias?: string,
  query?: string,
  route: string,
  isPositiveRating: boolean,
  t: TFunction
}

type StateType = {
  selectedFeedbackOption: ?FeedbackDropdownType,
  comment: string,
  isPositiveRating: boolean
}

class Feedback extends React.Component<PropsType, StateType> {
  constructor (props: PropsType) {
    super(props)
    this.state = {selectedFeedbackOption: null, comment: '', isPositiveRating: props.isPositiveRating}
  }

  onPositiveRatingClicked = () => this.setState({isPositiveRating: true})

  onNegativeRatingClicked = () => this.setState({isPositiveRating: false})

  onCommentChanged = (event: {target: {value: string}}) => this.setState({comment: event.target.value})

  onFeedbackOptionChanged = (selectedDropdown: FeedbackDropdownType) => {
    this.setState({selectedFeedbackOption: selectedDropdown})
  }

  onSubmit = () => {
    const {selectedFeedbackOption, isPositiveRating, comment} = this.state
    const {id, city, language, alias, query} = this.props

    if (selectedFeedbackOption) {
      const feedbackData = {
        feedbackType: selectedFeedbackOption.feedbackType,
        isPositiveRating,
        comment,
        id,
        city: city || INTEGREAT_INSTANCE,
        language: language || DEFAULT_FEEDBACK_LANGUAGE,
        alias,
        query
      }
      FeedbackEndpoint.postData(feedbackData)
    }
  }

  render () {
    const {isPositiveRating, comment} = this.state
    const {t, city, cities, route, id, alias, query, title} = this.props
    return (
      <FeedbackBox>
        <Title>{t('feedback')}</Title>
        <RatingContainer>
          <RatingItem
            name='smile-o'
            selected={isPositiveRating}
            onClick={this.onPositiveRatingClicked} />
          <RatingItem
            name='frown-o'
            selected={!isPositiveRating}
            onClick={this.onNegativeRatingClicked} />
        </RatingContainer>
        <Description>{t('feedbackType')}</Description>
        <FeedbackDropdown
          city={city}
          title={title}
          route={route}
          id={id}
          alias={alias}
          query={query}
          cities={cities}
          onFeedbackOptionChanged={this.onFeedbackOptionChanged} />
        <Description>{isPositiveRating ? t('positiveComment') : t('negativeComment')}</Description>
        <CommentField rows={3} value={comment} onChange={this.onCommentChanged} />
        <SubmitButton onClick={this.onSubmit}>{t('send')}</SubmitButton>
      </FeedbackBox>
    )
  }
}

export default translate('feedback')(Feedback)
