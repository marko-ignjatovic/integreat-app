import React, { FunctionComponent, ReactElement, ReactNode, Suspense, useCallback } from 'react'
import { Route, RouteComponentProps, Switch } from 'react-router-dom'

import {
  CATEGORIES_ROUTE,
  CityModel,
  createLanguagesEndpoint,
  DISCLAIMER_ROUTE,
  EVENTS_ROUTE,
  LanguageModel,
  normalizePath,
  NotFoundError,
  OFFERS_ROUTE,
  POIS_ROUTE,
  SEARCH_ROUTE,
  SPRUNGBRETT_OFFER_ROUTE,
  useLoadFromEndpoint
} from 'api-client'

import FailureSwitcher from './components/FailureSwitcher'
import GeneralFooter from './components/GeneralFooter'
import GeneralHeader from './components/GeneralHeader'
import LanguageFailure from './components/LanguageFailure'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import LocationLayout from './components/LocationLayout'
import buildConfig from './constants/buildConfig'
import { cmsApiBaseUrl } from './constants/urls'
import useWindowDimensions from './hooks/useWindowDimensions'
import {
  createPath,
  LOCAL_NEWS_ROUTE,
  RoutePatterns,
  RouteProps,
  RouteType,
  TU_NEWS_DETAIL_ROUTE,
  TU_NEWS_ROUTE
} from './routes'
import lazyWithRetry from './utils/retryImport'

const TuNewsDetailPage = lazyWithRetry(() => import('./routes/TuNewsDetailPage'))
const TuNewsPage = lazyWithRetry(() => import('./routes/TuNewsPage'))
const OffersPage = lazyWithRetry(() => import('./routes/OffersPage'))
const EventsPage = lazyWithRetry(() => import('./routes/EventsPage'))
const CategoriesPage = lazyWithRetry(() => import('./routes/CategoriesPage'))
const LocalNewsPage = lazyWithRetry(() => import('./routes/LocalNewsPage'))
const SprungbrettOfferPage = lazyWithRetry(() => import('./routes/SprungbrettOfferPage'))
const PoisPage = lazyWithRetry(() => import('./routes/PoisPage'))
const SearchPage = lazyWithRetry(() => import('./routes/SearchPage'))
const DisclaimerPage = lazyWithRetry(() => import('./routes/DisclaimerPage'))

type PropsType = {
  cities: CityModel[]
} & RouteComponentProps<{ cityCode: string; languageCode: string }>

export type CityRouteProps = {
  cities: Array<CityModel>
  cityModel: CityModel
  languages: Array<LanguageModel>
  languageModel: LanguageModel
}

const CityContentSwitcher = ({ cities, match, location }: PropsType): ReactElement => {
  const { viewportSmall } = useWindowDimensions()
  const { cityCode, languageCode } = match.params
  const cityModel = cities.find(it => it.code === cityCode)

  const requestLanguages = useCallback(
    async () => createLanguagesEndpoint(cmsApiBaseUrl).request({ city: cityCode }),
    [cityCode]
  )
  const { data: languages, loading, error: loadingError } = useLoadFromEndpoint<LanguageModel[]>(requestLanguages)
  const languageModel = languages?.find(it => it.code === languageCode)

  if (!cityModel || !languageModel || !languages) {
    if (loading) {
      return (
        <Layout>
          <LoadingSpinner />
        </Layout>
      )
    }

    if (loadingError || !cityModel || !languages) {
      const cityError = !cityModel
        ? new NotFoundError({ type: 'city', id: cityCode, city: cityCode, language: languageCode })
        : null
      const error = cityError || loadingError || new Error('Languages should not be null!')

      return (
        <Layout
          header={<GeneralHeader languageCode={languageCode} viewportSmall={viewportSmall} />}
          footer={<GeneralFooter language={languageCode} />}>
          <FailureSwitcher error={error} />
        </Layout>
      )
    }

    return (
      <Layout
        header={<GeneralHeader languageCode={languageCode} viewportSmall={viewportSmall} />}
        footer={<GeneralFooter language={languageCode} />}>
        <LanguageFailure
          cityModel={cityModel}
          languageCode={languageCode}
          languageChangePaths={languages.map(({ code, name }) => ({
            code,
            name,
            path: createPath(CATEGORIES_ROUTE, { cityCode, languageCode: code })
          }))}
        />
      </Layout>
    )
  }

  const cityRouteProps: CityRouteProps = { cities, languages, cityModel, languageModel }
  const { eventsEnabled, offersEnabled } = cityModel
  const localNewsEnabled = buildConfig().featureFlags.newsStream && cityModel.pushNotificationsEnabled
  const tuNewsEnabled = buildConfig().featureFlags.newsStream && cityModel.tunewsEnabled
  const poisEnabled = buildConfig().featureFlags.pois && cityModel.poisEnabled

  const suspenseLayoutProps = {
    cityModel,
    viewportSmall,
    feedbackTargetInformation: null,
    languageChangePaths: null,
    languageCode,
    pathname: normalizePath(location.pathname),
    isLoading: true
  }

  const render =
    <S extends RouteType>(
      route: S,
      Component: FunctionComponent<CityRouteProps & RouteProps<S>>
    ): ((p: RouteProps<S>) => ReactNode) =>
    (props: RouteProps<S>): ReactNode =>
      (
        <Suspense
          fallback={
            <LocationLayout {...suspenseLayoutProps} route={route}>
              <LoadingSpinner />
            </LocationLayout>
          }>
          <Component {...cityRouteProps} {...props} />
        </Suspense>
      )

  const routes: ReactElement[] = []
  if (eventsEnabled) {
    routes.push(
      <Route key={EVENTS_ROUTE} render={render(EVENTS_ROUTE, EventsPage)} path={RoutePatterns[EVENTS_ROUTE]} exact />
    )
  }
  if (offersEnabled) {
    routes.push(
      <Route
        key={SPRUNGBRETT_OFFER_ROUTE}
        render={render(SPRUNGBRETT_OFFER_ROUTE, SprungbrettOfferPage)}
        path={RoutePatterns[SPRUNGBRETT_OFFER_ROUTE]}
        exact
      />,
      <Route key={OFFERS_ROUTE} render={render(OFFERS_ROUTE, OffersPage)} path={RoutePatterns[OFFERS_ROUTE]} exact />
    )
  }
  if (poisEnabled) {
    routes.push(<Route key={POIS_ROUTE} render={render(POIS_ROUTE, PoisPage)} path={RoutePatterns[POIS_ROUTE]} exact />)
  }
  if (localNewsEnabled) {
    routes.push(
      <Route
        key={LOCAL_NEWS_ROUTE}
        render={render(LOCAL_NEWS_ROUTE, LocalNewsPage)}
        path={RoutePatterns[LOCAL_NEWS_ROUTE]}
        exact
      />
    )
  }
  if (tuNewsEnabled) {
    routes.push(
      <Route
        key={TU_NEWS_ROUTE}
        render={render(TU_NEWS_ROUTE, TuNewsPage)}
        path={RoutePatterns[TU_NEWS_ROUTE]}
        exact
      />,
      <Route
        key={TU_NEWS_DETAIL_ROUTE}
        render={render(TU_NEWS_DETAIL_ROUTE, TuNewsDetailPage)}
        path={RoutePatterns[TU_NEWS_DETAIL_ROUTE]}
        exact
      />
    )
  }
  routes.push(
    <Route key={SEARCH_ROUTE} render={render(SEARCH_ROUTE, SearchPage)} path={RoutePatterns[SEARCH_ROUTE]} exact />,
    <Route
      key={DISCLAIMER_ROUTE}
      render={render(DISCLAIMER_ROUTE, DisclaimerPage)}
      path={RoutePatterns[DISCLAIMER_ROUTE]}
      exact
    />,
    <Route
      key={CATEGORIES_ROUTE}
      render={render(CATEGORIES_ROUTE, CategoriesPage)}
      path={RoutePatterns[CATEGORIES_ROUTE]}
    />
  )
  return <Switch>{routes}</Switch>
}

export default CityContentSwitcher
