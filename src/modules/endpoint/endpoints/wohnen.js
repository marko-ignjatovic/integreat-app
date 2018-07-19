// @flow

import EndpointBuilder from '../EndpointBuilder'
import ParamMissingError from '../errors/ParamMissingError'
import type { EndpointParamsType, PayloadDataType } from 'flowTypes'
import WohnenOfferModel from '../models/WohnenOfferModel'
import moment from 'moment'

const WOHNEN_ENDPOINT_NAME = 'wohnen'

export default new EndpointBuilder(WOHNEN_ENDPOINT_NAME)
  .withParamsToUrlMapper((params: EndpointParamsType): string => {
    if (!params.city) {
      throw new ParamMissingError(WOHNEN_ENDPOINT_NAME, 'city')
    }

    return `https://api.wohnen.integreat-app.de/v0/${params.city}/offer`
  })
  .withMapper((json: any): PayloadDataType => json
    .map(offer => new WohnenOfferModel({
      email: offer.email,
      createdDate: moment(offer.created_at),
      formData: new FormData()
    })))
  .build()
