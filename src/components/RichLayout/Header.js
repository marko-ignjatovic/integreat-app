import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import FontAwesome from 'react-fontawesome'

import Navigation from 'Navigation'

import LanguageFlyout from 'components/LanguageFlyout'

import HeaderDropDown from './HeaderDropDown'

import style from './Header.css'
import logoWide from './assets/integreat-app-logo.png'
import logoSquare from './assets/integreat-logo-square.png'
import { Link } from 'redux-little-router'
import LANGUAGE_ENDPOINT from 'endpoints/language'
import { connect } from 'react-redux'
import LanguageModel from '../../endpoints/models/LanguageModel'
import withFetcher from '../../endpoints/withFetcher'

class NavElement extends React.Component {
  static propTypes = {
    to: PropTypes.string.isRequired,
    className: PropTypes.string,
    disableActiveStyle: PropTypes.bool
  }

  render () {
    return (
      <Link href={this.props.to}
            activeProps={{className: this.props.disableActiveStyle ? this.props.className : cx(this.props.className, style.itemActive)}}
            className={this.props.className}>
        {this.props.children}
      </Link>
    )
  }
}

class LanguageElementWrapper extends React.Component {
  static propTypes = {
    location: PropTypes.string.isRequired,
    languageCallback: PropTypes.func,
    /**
     * from withFetcher HOC which provides data from LANGUAGE_ENDPOINT
     */
    languages: PropTypes.arrayOf(PropTypes.instanceOf(LanguageModel))
  }

  render () {
    return this.props.location &&
      <HeaderDropDown className={style.itemLanguage} fontAwesome="language">
        <LanguageFlyout
          languageCallback={this.props.languageCallback}
          languages={this.props.languages}
        />
      </HeaderDropDown>
  }
}

const FetchingLanguageElementWrapper = withFetcher(LANGUAGE_ENDPOINT, true, true)(LanguageElementWrapper)

class Header extends React.Component {
  static propTypes = {
    languageCallback: PropTypes.func,
    navigation: PropTypes.instanceOf(Navigation).isRequired,
    location: PropTypes.string
  }

  render () {
    return (
      <header className={style.spacer}>
        <div className={style.header}>
          {/* Logo */}
          <NavElement to={this.props.navigation.home} className={style.logo} disableActiveStyle={true}>
            <img className={style.logoWide}
                 src={logoWide}/>
            <img className={style.logoSquare}
                 src={logoSquare}/>
          </NavElement>
          <div className={style.itemsContainer}>
            {/* Home for small devices */}
            <NavElement to={this.props.navigation.home} className={cx(style.item, style.itemHome)}>
              <FontAwesome className={style.fontAwesome} name='home'/>
            </NavElement>
            {/* Location */}
            {this.props.location &&
            <NavElement to={this.props.navigation.search} className={cx(style.item, style.itemSearch)}>
              <FontAwesome className={style.fontAwesome} name='search'/>
            </NavElement>
            }
            <NavElement to={this.props.navigation.locationSelection} className={cx(style.item, style.itemLocation)}>
              <FontAwesome className={style.fontAwesome} name='map-marker'/>
            </NavElement>
            {/* Language */}
            <FetchingLanguageElementWrapper languageCallback={this.props.languageCallback}
                                            location={this.props.location}/>
          </div>
        </div>
      </header>
    )
  }
}

const mapStateToProps = (state) => ({
  location: state.router.params.location,
  language: state.router.params.language,
  navigation: new Navigation(state.router.params.location, state.router.params.language)
})

export default connect(mapStateToProps)(Header)
