import { all, call, Effect, ForkEffect, put, select, takeLatest } from 'redux-saga/effects'
import { FetchPoiActionType, FetchPoiFailedActionType, PushPoiActionType } from '../redux/StoreActionType'
import { DataContainer } from '../services/DataContainer'
import loadCityContent from './loadCityContent'
import { ContentLoadCriterion } from '../models/ContentLoadCriterion'
import isPeekingRoute from '../redux/selectors/isPeekingRoute'
import { ErrorCode, fromError, LanguageModel } from 'api-client'

export function* fetchPoi(dataContainer: DataContainer, action: FetchPoiActionType): Generator<Effect, void, any> {
  const { city, language, path, key, criterion } = action.params

  try {
    const peeking = yield select(state =>
      isPeekingRoute(state, {
        routeCity: city
      })
    )
    const loadCriterion = new ContentLoadCriterion(criterion, peeking)
    const languageValid = yield call(loadCityContent, dataContainer, city, language, loadCriterion)
    // Only get languages if we've loaded them, otherwise we're peeking
    const cityLanguages: Array<LanguageModel> = loadCriterion.shouldLoadLanguages()
      ? yield call(dataContainer.getLanguages, city)
      : []

    if (languageValid) {
      const [pois, resourceCache] = yield all([
        call(dataContainer.getPois, city, language),
        call(dataContainer.getResourceCache, city, language)
      ])
      const insert: PushPoiActionType = {
        type: 'PUSH_POI',
        params: {
          pois,
          resourceCache,
          path,
          cityLanguages,
          key,
          language,
          city
        }
      }
      yield put(insert)
    } else {
      const allAvailableLanguages = path === null ? new Map(cityLanguages.map(lng => [lng.code, null])) : null
      const failed: FetchPoiFailedActionType = {
        type: 'FETCH_POI_FAILED',
        params: {
          message: 'Could not load poi.',
          code: ErrorCode.PageNotFound,
          allAvailableLanguages,
          path: null,
          key,
          language,
          city
        }
      }
      yield put(failed)
    }
  } catch (e) {
    console.error(e)
    const failed: FetchPoiFailedActionType = {
      type: 'FETCH_POI_FAILED',
      params: {
        message: `Error in fetchPoi: ${e.message}`,
        code: fromError(e),
        key,
        city,
        language,
        path,
        allAvailableLanguages: null
      }
    }
    yield put(failed)
  }
}
export default function* (dataContainer: DataContainer): Generator<ForkEffect, void> {
  yield takeLatest('FETCH_POI', fetchPoi, dataContainer)
}
