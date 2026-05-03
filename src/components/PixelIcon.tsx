import {
  IconArrowBigRight,
  IconArrowLeft,
  IconBolt,
  IconBomb,
  IconBook,
  IconBulb,
  IconClockPause,
  IconCode,
  IconDeviceFloppy,
  IconGauge,
  IconGitBranch,
  IconFolderDown,
  IconHome2,
  IconHeart,
  IconListDetails,
  IconMenu2,
  IconNavigation,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRadar2,
  IconRefresh,
  IconSettings,
  IconTag,
  IconTargetArrow,
  IconX,
} from '@tabler/icons-react'
import type { ElementType } from 'react'

type PixelIconProps = {
  grid: string[]
  color: string
}

const gridKey = (grid: string[]): string => grid.join('\n')

const iconByGrid = new Map<string, ElementType>([
  [gridKey(['#    ', '##   ', '###  ', '##   ', '#    ']), IconBolt],
  [gridKey([' ### ', '# # #', ' ### ', '# # #', ' ### ']), IconSettings],
  [gridKey(['#####', '#   #', '#####', '#   #', '#####']), IconCode],
  [gridKey(['#### ', '#   #', '#### ', '#   #', '#   #']), IconBook],
  [gridKey(['  #  ', '  #  ', '#####', '  #  ', '  #  ']), IconPlus],
  [gridKey([' #    ', '##    ', '##### ', '##    ', ' #    ']), IconArrowLeft],
  [gridKey(['#   #', ' # # ', '  #  ', ' # # ', '#   #']), IconX],
  [gridKey([' ### ', '#   #', '## ##', '#   #', ' ### ']), IconRefresh],
  [gridKey(['#####', '#   #', '# # #', '#   #', '#####']), IconDeviceFloppy],
  [gridKey([' ### ', '#   #', '#   #', '#   #', ' ### ']), IconHeart],
  [gridKey(['  #  ', ' ### ', '#####', ' ### ', '  #  ']), IconBulb],
  [gridKey(['#### ', '#   #', '###  ', '# #  ', '###  ']), IconFolderDown],
  [gridKey(['  #  ', ' ### ', '#####', ' ### ', '  #  ', '  #  ', '  #  ']), IconNavigation],
  [gridKey([' ### ', '#####', ' # # ', ' # # ', '  #  ', '  #  ', '  #  ']), IconTargetArrow],
  [gridKey(['#   #', ' # # ', '  #  ', ' ### ', '#####', ' ### ', '  #  ']), IconBomb],
  [gridKey(['  #  ', ' # # ', '#   #', '  #  ', '  #  ', '  #  ', ' ### ']), IconRadar2],
  [gridKey([' ### ', '#   #', '   # ', '  #  ', '     ', '  #  ', '  #  ']), IconGitBranch],
  [gridKey(['#####', ' # # ', '  #  ', ' # # ', '#####']), IconClockPause],
  [gridKey(['#### ', '#   #', '#### ', '#    ', '#    ']), IconTag],
  [gridKey([' ### ', '#   #', '    #', '  ## ', ' #   ', '#### ']), IconArrowBigRight],
  [gridKey(['#####', '#   #', '### #', '#   #', '#####']), IconRadar2],
  [gridKey([' ### ', '#   #', '# # #', '#   #', ' ### ']), IconRadar2],
  [gridKey(['#   #', '## ##', '# # #', '#   #', '#   #']), IconTargetArrow],
  [gridKey(['#   #', '## ##', '# # #', '#   #', ' ### ']), IconNavigation],
  [gridKey([' ### ', '#   #', '#   #', '#   #', ' ### ']), IconRefresh],
  [gridKey(['#####', '#   #', '#   #', '#   #', '#####']), IconCode],
  [gridKey(['#####', '# # #', '# # #', '# # #', '#####']), IconSettings],
  [gridKey([' ### ', '#####', ' ### ', ' ### ', ' # # ']), IconX],
  [gridKey(['  #  ', ' ### ', '#   #', ' ### ', '  #  ']), IconPlus],
  [gridKey([' ### ', ' # # ', ' ### ', '  #  ', '  #  ']), IconTag],
  [gridKey(['#####', '# # #', '#   #', '# # #', '#####']), IconMenu2],
  [gridKey(['# #', '# #', '# #', '# #', '# #']), IconPlayerPause],
  [gridKey(['#   #', '##  #', '### #', '##  #', '#   #']), IconPlayerPlay],
  [gridKey(['#  # ', '## # ', '#### ', '## # ', '#  # ']), IconPlayerPlay],
  [gridKey(['#####', '     ', '#####', '     ', '#####']), IconHome2],
  [gridKey(['#  # ', '## ##', '#####', '## ##', '#  # ']), IconGauge],
  [gridKey(['#   #', '#####', '# # #', '#####', '#   #']), IconListDetails],
])

export function PixelIcon({ grid, color }: PixelIconProps) {
  const Icon = iconByGrid.get(gridKey(grid)) ?? IconCode

  return (
    <Icon
      color={color}
      size="1.2em"
      stroke={1.9}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    />
  )
}
