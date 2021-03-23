// @flow

import buildConfig from '../app/constants/buildConfig'
import Url from 'url-parse'
import type { RouteInformationType } from 'api-client'
import { JPAL_TRACKING_ROUTE, OFFERS_ROUTE, SPRUNGBRETT_OFFER_ROUTE } from 'api-client'

const constructUrl = (parts: Array<?string>) => {
  const url = new Url(`https://${buildConfig().hostName}`)
  const pathname = parts
    .filter(Boolean)
    .map(part => part.toLowerCase())
    .join('/')
  url.set('pathname', pathname)
  return url
}

export const cityContentPath = ({ cityCode, languageCode, route, path }: CityContentRouteUrlType): string => {
  const url = constructUrl([cityCode, languageCode, route, path])
  return url.pathname
}

const constructUrlFromRouteInformation = (routeInformation: RouteInformationType) => {
  const { route } = routeInformation
  if (route === JPAL_TRACKING_ROUTE) {
    // https://integreat.app/jpal
    return constructUrl([route])
  } else if (route === SPRUNGBRETT_OFFER_ROUTE) {
    const { cityCode, languageCode } = routeInformation
    // https://integreat.app/augsburg/de/offers/sprungbrett
    return constructUrl([cityCode, languageCode, OFFERS_ROUTE, route])
  } else if (routeInformation.cityContentPath) {
    // https://integreat.app/augsburg/de/, https://integreat.app/augsburg/de/events/12345
    return constructUrl([routeInformation.cityContentPath])
  } else if (routeInformation.cityCode) {
    // https://integreat.app/augsburg/de/offers, https://integreat.app/augsburg/de/search, ...
    const { cityCode, languageCode } = routeInformation
    const newsType = routeInformation.newsType || null
    const newsId = routeInformation.newsId || null
    return constructUrl([cityCode, languageCode, route, newsType, newsId])
  } else {
    // https://integreat.app
    return constructUrl([])
  }
}

export const urlFromRouteInformation = (routeInformation: RouteInformationType): string => {
  const url = constructUrlFromRouteInformation(routeInformation)
  return url.href
}

export default urlFromRouteInformation
