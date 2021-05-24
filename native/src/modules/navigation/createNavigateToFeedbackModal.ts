import { FeedbackInformationType } from '../feedback/FeedbackContainer'
import { FEEDBACK_MODAL_ROUTE } from 'api-client/src/routes'
import { NavigationPropType, RoutesType } from '../app/constants/NavigationTypes'
import sendTrackingSignal from '../endpoint/sendTrackingSignal'
import { OPEN_PAGE_SIGNAL_NAME } from 'api-client'

const createNavigateToFeedbackModal = <T extends RoutesType>(navigation: NavigationPropType<T>) => (
  feedbackInformation: FeedbackInformationType
) => {
  sendTrackingSignal({
    signal: {
      name: OPEN_PAGE_SIGNAL_NAME,
      pageType: FEEDBACK_MODAL_ROUTE,
      url: ''
    }
  })
  navigation.navigate({
    name: FEEDBACK_MODAL_ROUTE,
    params: feedbackInformation
  })
}

export default createNavigateToFeedbackModal