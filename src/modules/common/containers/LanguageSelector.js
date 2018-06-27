// @flow

import React from 'react'
import { connect } from 'react-redux'
import compose from 'lodash/fp/compose'

import LanguageModel from 'modules/endpoint/models/LanguageModel'
import SelectorItemModel from '../models/SelectorItemModel'
import Selector from '../components/Selector'
import CategoriesMapModel from '../../endpoint/models/CategoriesMapModel'
import EventModel from '../../endpoint/models/EventModel'
import HeaderLanguageSelectorItem from '../../layout/components/HeaderLanguageSelectorItem'

import type { Location } from 'redux-first-router/dist/flow-types'
import type { I18nTranslateType, StateType } from '../../../flowTypes'
import getLanguageChangePath from '../../app/getLanguageChangePath'
import { translate } from 'react-i18next'

type PropsType = {
  languages: Array<LanguageModel>,
  location: Location,
  categories: CategoriesMapModel,
  events: Array<EventModel>,
  isHeaderActionItem: boolean,
  t: I18nTranslateType
}

/**
 * Displays a dropDown menu to handle changing of the language
 */
export class LanguageSelector extends React.Component<PropsType> {
  getSelectorItemModels (): Array<SelectorItemModel> {
    const {categories, events, location, languages} = this.props
    return languages && languages
      .map(language =>
        new SelectorItemModel({
          code: language.code,
          name: language.name,
          href: getLanguageChangePath({categories, events, location, languageCode: language.code})
        })
      )
  }

  render () {
    const {location, isHeaderActionItem, t} = this.props
    const selectorItems = this.getSelectorItemModels()
    const activeItemCode = location.payload.language

    if (isHeaderActionItem) {
      return <HeaderLanguageSelectorItem selectorItems={selectorItems} activeItemCode={activeItemCode} />
    } else {
      return selectorItems && <Selector verticalLayout
                                        items={selectorItems}
                                        activeItemCode={activeItemCode}
                                        inactiveItemTooltip={t('noTranslation')} />
    }
  }
}

const mapStateToProps = (state: StateType) => ({
  location: state.location,
  languages: state.languages.data,
  categories: state.categories.data,
  events: state.events.data
})

export default compose(
  connect(mapStateToProps),
  translate('layout')
)(LanguageSelector)
