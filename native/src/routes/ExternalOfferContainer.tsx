import React, { ReactElement } from 'react'

import { ExternalOfferRouteType } from 'api-client'

import { NavigationPropType, RoutePropType } from '../constants/NavigationTypes'
import ExternalOffer from './ExternalOffer'

type ExternalOfferContainerPropsType = {
  route: RoutePropType<ExternalOfferRouteType>
  navigation: NavigationPropType<ExternalOfferRouteType>
}

const ExternalOfferContainer = ({ route, navigation: _navigation }: ExternalOfferContainerPropsType): ReactElement => {
  const { url, postData } = route.params
  return <ExternalOffer url={url} postData={postData} />
}

export default ExternalOfferContainer
