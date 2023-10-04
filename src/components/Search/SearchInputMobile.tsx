import React, { useEffect, useRef, useState } from 'react'

import { useLocation } from '@reach/router'
import classNames from 'classnames'

import useFormatMessage from '../../hooks/useFormatMessage'
import { useProposalsSearchParams } from '../../hooks/useProposalsSearchParams'
import locations, { navigate } from '../../utils/locations'
import Cross from '../Icon/Cross'
import Magnify from '../Icon/Magnifiy'

import './SearchInputMobile.css'

function handleSearch(textSearch: string, location: Location) {
  const newParams = new URLSearchParams(location.search)
  if (textSearch) {
    newParams.set('search', textSearch)
    newParams.delete('page')
    newParams.delete('order')
  } else {
    newParams.delete('search')
    newParams.delete('page')
  }

  navigate(locations.proposals(newParams))
}

export default function SearchInputMobile() {
  const t = useFormatMessage()
  const location = useLocation()
  const { search } = useProposalsSearchParams()
  const searchInput = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState(() => search || '')

  const focusSearch = () => {
    setTimeout(() => {
      searchInput.current?.setAttribute('autofocus', 'autofocus')
      searchInput.current?.click()
    }, 500)
  }

  useEffect(() => {
    if (!search) {
      setSearchText('')
      setOpen(false)
    } else {
      focusSearch()
    }
  }, [search])

  const handleChange = (e: React.ChangeEvent<any>) => {
    setSearchText(e.target.value)
  }

  const handleClear = () => {
    if (searchText === '') {
      setOpen(false)
    } else {
      setSearchText('')
      focusSearch()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchText, location)
    }
  }

  const keyUpHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === 'Escape') {
      setSearchText('')
    }
  }

  const handleOpen = () => {
    if (!open) {
      setOpen(true)
      focusSearch()
    }
  }

  return (
    <div className={classNames('SearchInputMobile', open && 'SearchInputMobile--open')}>
      <button className="SearchInputMobile__Button" onClick={handleOpen}>
        <Magnify />
      </button>
      <input
        className={classNames('SearchInputMobile__Input', open && 'SearchInputMobile__Input--open')}
        value={searchText}
        placeholder={t('navigation.search.placeholder') || ''}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        onKeyUp={keyUpHandler}
        onFocus={() => setOpen(true)}
        // onBlur={() => setOpen(!!searchText)}
        ref={searchInput}
      />
      <Cross
        size="14"
        color="var(--black-800)"
        className={classNames('SearchInputMobile__Icon', open && 'SearchInputMobile__Icon--open')}
        onClick={handleClear}
      />
    </div>
  )
}
