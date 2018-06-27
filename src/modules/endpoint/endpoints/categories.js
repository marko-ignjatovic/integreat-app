// @flow

import CategoryModel from '../models/CategoryModel'
import CategoriesMapModel from '../models/CategoriesMapModel'
import { apiUrl } from '../constants'
import normalizeUrl from 'normalize-url'
import { toPairs } from 'lodash/object'

import EndpointBuilder from '../EndpointBuilder'
import ParamMissingError from '../errors/ParamMissingError'
import type { EndpointParamsType } from '../../../flowTypes'
import moment from 'moment'

const CATEGORIES_ENDPOINT_NAME = 'categories'

export default new EndpointBuilder(CATEGORIES_ENDPOINT_NAME)
  .withParamsToUrlMapper((params: EndpointParamsType): string => {
    if (!params.city) {
      throw new ParamMissingError(CATEGORIES_ENDPOINT_NAME, 'city')
    }
    if (!params.language) {
      throw new ParamMissingError(CATEGORIES_ENDPOINT_NAME, 'language')
    }
    return `${apiUrl}/${params.city}/${params.language}/wp-json/extensions/v3/pages`
  })
  .withMapper((json: any, params: EndpointParamsType): CategoriesMapModel => {
    if (!params.city) {
      throw new ParamMissingError(CATEGORIES_ENDPOINT_NAME, 'city')
    }
    if (!params.language) {
      throw new ParamMissingError(CATEGORIES_ENDPOINT_NAME, 'language')
    }
    const city = params.city
    const basePath = `/${city}/${params.language}`
    const categories = json
      .map(category => {
        return new CategoryModel({
          id: category.id,
          path: normalizeUrl(category.path),
          title: category.title,
          content: category.content,
          thumbnail: category.thumbnail,
          order: category.order,
          availableLanguages: new Map(
            toPairs(category.available_languages).map(([key, value]) => [key, normalizeUrl(value.path)])),
          parentPath: normalizeUrl(category.parent.path || basePath),
          lastUpdate: moment(category.modified_gmt)
        })
      })

    categories.push(new CategoryModel({
      id: 0,
      path: basePath,
      title: city,
      parentPath: '',
      content: '',
      thumbnail: '',
      order: -1,
      availableLanguages: new Map(),
      lastUpdate: ''
    }))

    return new CategoriesMapModel(categories)
  })
  .build()
