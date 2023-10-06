interface Props {
  size?: number
}

function AddPoi({ size = 48 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#D4EEC5" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.5117 30.1953C20.6862 31.8568 21.6458 33.2318 22.3906 34.3203C22.5911 34.6068 22.8776 34.75 23.25 34.75C23.6224 34.75 23.9089 34.6068 24.1094 34.3203L26.9883 30.1953C28.4206 28.1328 29.3659 26.7435 29.8242 26.0273C30.4831 24.9961 30.9271 24.1367 31.1562 23.4492C31.3854 22.7331 31.5 21.9167 31.5 21C31.5 19.5104 31.1276 18.1354 30.3828 16.875C29.638 15.6146 28.6354 14.612 27.375 13.8672C26.1146 13.1224 24.7396 12.75 23.25 12.75C21.7604 12.75 20.3854 13.1224 19.125 13.8672C17.8646 14.612 16.862 15.6146 16.1172 16.875C15.3724 18.1354 15 19.5104 15 21C15 21.9167 15.1146 22.7331 15.3438 23.4492C15.5729 24.1367 16.0169 24.9961 16.6758 26.0273C17.1341 26.7435 18.0794 28.1328 19.5117 30.1953ZM23.5 26.5C22.9477 26.5 22.5 26.0523 22.5 25.5V22H19C18.4477 22 18 21.5523 18 21C18 20.4477 18.4477 20 19 20H22.5V16.5C22.5 15.9477 22.9477 15.5 23.5 15.5C24.0523 15.5 24.5 15.9477 24.5 16.5V20H28C28.5523 20 29 20.4477 29 21C29 21.5523 28.5523 22 28 22H24.5V25.5C24.5 26.0523 24.0523 26.5 23.5 26.5Z"
        fill="#44B600"
      />
    </svg>
  )
}

export default AddPoi
