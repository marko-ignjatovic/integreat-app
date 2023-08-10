import distance from '@turf/distance'
import moment, { Moment } from 'moment'
// Fix for minifying js issue with hermes using moment().locale https://github.com/moment/moment/issues/5789
import 'moment/locale/de'

import { GeoJsonPoi, LocationType, mapMarker } from '../maps'
import ExtendedPageModel from './ExtendedPageModel'
import LocationModel from './LocationModel'
import OpeningHoursModel from './OpeningHoursModel'
import PageModel from './PageModel'
import PoiCategoryModel from './PoiCategoryModel'

class PoiModel extends ExtendedPageModel {
  _location: LocationModel<number>
  _excerpt: string
  _metaDescription: string | null
  _website: string | null
  _phoneNumber: string | null
  _email: string | null
  _openingHours: OpeningHoursModel[] | null
  _temporarilyClosed: boolean
  _category: PoiCategoryModel | null

  constructor(params: {
    path: string
    title: string
    content: string
    thumbnail: string
    availableLanguages: Map<string, string>
    metaDescription: string | null
    excerpt: string
    location: LocationModel<number>
    lastUpdate: Moment
    email: string | null
    website: string | null
    phoneNumber: string | null
    temporarilyClosed: boolean
    openingHours: OpeningHoursModel[] | null
    category: PoiCategoryModel | null
  }) {
    const {
      category,
      openingHours,
      temporarilyClosed,
      location,
      excerpt,
      metaDescription,
      website,
      phoneNumber,
      email,
      ...other
    } = params
    super(other)
    this._location = location
    this._excerpt = excerpt
    this._metaDescription = metaDescription
    this._website = website
    this._phoneNumber = phoneNumber
    this._email = email
    this._openingHours = openingHours
    this._temporarilyClosed = temporarilyClosed
    this._category = category
  }

  get location(): LocationModel<number> {
    return this._location
  }

  get excerpt(): string {
    return this._excerpt
  }

  get metaDescription(): string | null {
    return this._metaDescription
  }

  get website(): string | null {
    return this._website
  }

  get phoneNumber(): string | null {
    return this._phoneNumber
  }

  get email(): string | null {
    return this._email
  }

  private getMarkerSymbol(): string {
    const { color, iconName } = this.category
    return `${iconName}_${color}`
  }

  getFeature(userLocation?: LocationType): GeoJsonPoi {
    const { name, id, address, coordinates } = this.location

    return {
      title: name,
      category: this.category?.name,
      id,
      symbol: this.getMarkerSymbol(),
      thumbnail: this.thumbnail,
      path: this.path,
      slug: this.slug,
      address,
      distance: userLocation ? distance(userLocation, coordinates).toFixed(1) : undefined,
    }
  }

  get openingHours(): OpeningHoursModel[] | null {
    return this._openingHours
  }

  get temporarilyClosed(): boolean {
    return this._temporarilyClosed
  }

  get category(): PoiCategoryModel {
    // TODO Remove fallback once https://github.com/digitalfabrik/integreat-cms/issues/2340 is done
    return (
      this._category ??
      new PoiCategoryModel({
        // eslint-disable-next-line no-magic-numbers
        id: 12,
        name: 'Others',
        color: '2E98FB',
        iconName: 'other',
        icon: 'https://integreat-test.tuerantuer.org/static/svg/poi-category-icons/other.svg',
      })
    )
  }

  get isCurrentlyOpen(): boolean {
    if (!this.openingHours) {
      return false
    }
    // isoWeekday return 1-7 for the weekdays
    const currentWeekday = moment().isoWeekday() - 1
    const currentDay = this.openingHours[currentWeekday]

    if (currentDay) {
      if (currentDay.allDay) {
        return true
      }
      const dateFormat = 'LT'
      const currentTime = moment().locale('de').format(dateFormat)
      return currentDay.timeSlots.some(timeslot =>
        moment(currentTime, dateFormat).isBetween(moment(timeslot.start, dateFormat), moment(timeslot.end, dateFormat))
      )
    }
    return false
  }

  isEqual(other: PageModel): boolean {
    return (
      other instanceof PoiModel &&
      super.isEqual(other) &&
      this.location.isEqual(other.location) &&
      this.excerpt === other.excerpt
    )
  }
}

export default PoiModel
