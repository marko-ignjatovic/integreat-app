// @flow

import * as React from 'react'
import { type TFunction, withTranslation } from 'react-i18next'
import withTheme from '../theme/hocs/withTheme'
import Feedback, { type PropsType as FeedbackPropsType } from './Feedback'
import type {
  CategoriesRouteType,
  DisclaimerRouteType,
  EventsRouteType,
  FeedbackParamsType,
  FeedbackType,
  OffersRouteType,
  PoisRouteType,
  SearchRouteType
} from 'api-client'
import {
  CATEGORIES_FEEDBACK_TYPE,
  CATEGORIES_ROUTE,
  CityModel,
  CONTENT_FEEDBACK_CATEGORY,
  createFeedbackEndpoint,
  DISCLAIMER_ROUTE,
  EVENTS_FEEDBACK_TYPE,
  EVENTS_ROUTE,
  OFFER_FEEDBACK_TYPE,
  OfferModel,
  OFFERS_FEEDBACK_TYPE,
  OFFERS_ROUTE,
  PAGE_FEEDBACK_TYPE,
  POIS_ROUTE,
  SEARCH_FEEDBACK_TYPE,
  SEARCH_ROUTE
} from 'api-client'
import determineApiUrl from '../endpoint/determineApiUrl'

export type SendingStatusType = 'idle' | 'sending' | 'failed' | 'successful'
export type FeedbackOriginType = 'positive' | 'negative' | 'searchInformationNotFound' | 'searchNothingFound'

type RouteType =
  | CategoriesRouteType
  | EventsRouteType
  | PoisRouteType
  | OffersRouteType
  | DisclaimerRouteType
  | SearchRouteType

export type FeedbackInformationType = {|
  routeType: RouteType,
  isPositiveFeedback: boolean,
  language: string,
  cityCode: string,
  path?: string,
  alias?: string,
  offers?: Array<OfferModel>
|}

type StateType = {|
  comment: string,
  contactMail: string,
  sendingStatus: SendingStatusType
|}

export type PropsType = {|
  routeType: RouteType,
  feedbackOrigin: FeedbackOriginType,
  language: string,
  cityCode: string,
  cities: $ReadOnlyArray<CityModel>,
  path?: string,
  alias?: string,
  query?: string,
  offers?: Array<OfferModel>
|}

export default class FeedbackContainer extends React.Component<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props)
    this.state = { comment: '', contactMail: '', sendingStatus: 'idle' }
  }

  getFeedbackType = (): FeedbackType => {
    const { routeType, path, alias } = this.props

    switch (routeType) {
      case EVENTS_ROUTE:
        return path ? PAGE_FEEDBACK_TYPE : EVENTS_FEEDBACK_TYPE
      case OFFERS_ROUTE:
        return alias ? OFFER_FEEDBACK_TYPE : OFFERS_FEEDBACK_TYPE
      case DISCLAIMER_ROUTE:
        return PAGE_FEEDBACK_TYPE
      case POIS_ROUTE:
        // TODO IGAPP-438 Handle pois list feedback correctly instead of returning categories feedback type
        return path ? PAGE_FEEDBACK_TYPE : CATEGORIES_FEEDBACK_TYPE
      case CATEGORIES_ROUTE:
        return path ? PAGE_FEEDBACK_TYPE : CATEGORIES_FEEDBACK_TYPE
      case SEARCH_ROUTE:
        return SEARCH_FEEDBACK_TYPE
      default:
        return CATEGORIES_FEEDBACK_TYPE
    }
  }

  getFeedbackData = (comment: string, contactMail: string): FeedbackParamsType => {
    const { path, alias, query, language, feedbackOrigin } = this.props
    const feedbackType = this.getFeedbackType()
    const city = this.props.cityCode
    const commentWithMail = `${comment}    Kontaktadresse: ${contactMail || 'Keine Angabe'}`

    return {
      feedbackType,
      feedbackCategory: CONTENT_FEEDBACK_CATEGORY,
      isPositiveRating: feedbackOrigin === 'positive',
      permalink: path,
      city,
      language,
      comment: commentWithMail,
      alias,
      query
    }
  }

  onFeedbackCommentChanged = (comment: string) => this.setState({ comment })

  onFeedbackContactMailChanged = (contactMail: string) => this.setState({ contactMail })

  handleSubmit = () => {
    const { comment, contactMail } = this.state
    const feedbackData = this.getFeedbackData(comment, contactMail)
    this.setState({ sendingStatus: 'sending' })
    const request = async () => {
      const apiUrl = await determineApiUrl()
      const feedbackEndpoint = createFeedbackEndpoint(apiUrl)
      await feedbackEndpoint.request(feedbackData)
      this.setState({ sendingStatus: 'successful' })
    }
    request().catch(err => {
      console.log(err)
      this.setState({ sendingStatus: 'failed' })
    })
  }

  render() {
    const { feedbackOrigin } = this.props
    const { comment, contactMail, sendingStatus } = this.state

    return (
      <ThemedTranslatedFeedback
        comment={comment}
        contactMail={contactMail}
        sendingStatus={sendingStatus}
        onCommentChanged={this.onFeedbackCommentChanged}
        onFeedbackContactMailChanged={this.onFeedbackContactMailChanged}
        feedbackOrigin={feedbackOrigin}
        onSubmit={this.handleSubmit}
      />
    )
  }
}

const ThemedTranslatedFeedback = withTheme<$Diff<FeedbackPropsType, {| t: TFunction |}>>(
  withTranslation<FeedbackPropsType>('feedback')(Feedback)
)