# Layer tree

Shortened: repeated rows and the screens that share the shell are listed once.

## Components

- COMPONENT_SET "Workspace tab", auto-layout horizontal
  - COMPONENT "State=Active": pad 7/8/7/12, gap 6, top corners 6, fill `surface`, border `border` on top and sides
    - TEXT "Name": Sen SemiBold 13, `text` (text property "Name")
    - FRAME "Close": 14x14 cross icon, `soft`
  - COMPONENT "State=Inactive": same box, no fill, no border
    - TEXT "Name": Sen Regular 13, `muted`
    - FRAME "Close": 14x14 cross icon, `muted`
- COMPONENT_SET "Tree row", 236x28, pad 5/8/5/12, gap 8, radius 6
  - COMPONENT "Kind=File": file icon 15, TEXT "Name" Sen Regular 13 `soft`
  - COMPONENT "Kind=Selected": as File, fill `raised`
  - COMPONENT "Kind=Folder": folder icon 15
- COMPONENT "Button / open externally": pad 6/12/6/10, gap 6, radius 8, fill `surface`, border `border`
  - FRAME "icon/open-external": 14x14, `soft`
  - TEXT "Label": Sen Medium 13, `text` (text property "Label")

## Shell, the same in every screen (1440x900, horizontal)

- FRAME "Sidebar": 260 wide, vertical, pad 16/12/16/12, gap 4, fill `surface`, border right
  - TEXT "exxperts", "Home", "Attachments", folder label "HANDBOOK"
  - INSTANCE "Tree row" per entry; the open file uses Kind=Selected
- FRAME "Chat": 420 wide, vertical, pad 18/20/20/24
  - TEXT room name, FRAME "Conversation" (fills), FRAME "Composer"
- FRAME "Right pane": fills the rest, vertical, fill `surface`, border left
  - FRAME "Open files": horizontal, pad 8/8/0/8, gap 2, fill `canvas`, border bottom
    - INSTANCE "Workspace tab" per open file; exactly one is State=Active
  - FRAME "File header": horizontal, space between, pad 12/16/12/16, border bottom
    - FRAME "File name and path": TEXT name Sen Bold 15, TEXT path Sen Regular 12 `muted`
    - INSTANCE "Button / open externally"
  - FRAME "Preview": fills, fill `inset`, clips its content

## Preview content per screen

- Excel:
  - FRAME "Sheet, scrolls both ways": white, vertical
    - FRAME "Column letters": cells 26 high, fill #f2f2f2, column A is 196 wide, B to E are 100
    - FRAME "Row" per row: row number cell 40 wide, then the cells; cells pad 4/8/4/8, grid lines 0.5 #d9d9d9, numbers right-aligned
  - FRAME "Sheets": horizontal, pad 0/8/0/8, gap 2, fill `canvas`, border top
    - FRAME "Sheet <name>" per sheet, pad 7/14/7/14; the active one has fill `surface` and Sen SemiBold 12
- Word and PDF:
  - FRAME "Scrolls": vertical, pad 24/0/24/0, gap 16, pages centred
    - FRAME "Page": 640 wide, white, pad 48/56/48/56, gap 14, soft shadow; the document's own content inside
- Image:
  - FRAME "Image, fits the pane": pad 24, image centred with a soft shadow

## States board

- FRAME "Preview states": one card per state, 330 wide, pad 14/16/16/16, gap 6, radius 12, fill `surface`, border `border`
  - TEXT state name Sen SemiBold 12 `muted`, TEXT file Sen Bold 14, TEXT sentence Sen Regular 13 `soft`
