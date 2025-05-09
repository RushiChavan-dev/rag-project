graph [
  node [
    id 0
    label "Incident_March 15, 2025"
    type "Incident"
    date "March 15, 2025"
  ]
  node [
    id 1
    label "Not specified (MVC - Motor Vehicle Collision)"
    type "Person"
  ]
  node [
    id 2
    label "Injuries"
    description "Concussion, Whiplash, Rib bruising"
  ]
  node [
    id 3
    label "Expenses"
    medical_costs "$1,595.00"
    transport_costs "$510.00"
  ]
  node [
    id 4
    label "Incident_"
    type "Incident"
    date ""
  ]
  node [
    id 5
    label ""
    type "Person"
  ]
  node [
    id 6
    label "Incident_Not specified"
    type "Incident"
    date "Not specified"
  ]
  node [
    id 7
    label "Not specified (other driver)"
    type "Person"
  ]
  edge [
    source 0
    target 1
    relation "involved"
  ]
  edge [
    source 0
    target 2
    relation "caused"
  ]
  edge [
    source 0
    target 3
    relation "incurred"
  ]
  edge [
    source 2
    target 4
    relation "caused"
  ]
  edge [
    source 2
    target 6
    relation "caused"
  ]
  edge [
    source 3
    target 4
    relation "incurred"
  ]
  edge [
    source 3
    target 6
    relation "incurred"
  ]
  edge [
    source 4
    target 5
    relation "involved"
  ]
  edge [
    source 6
    target 7
    relation "involved"
  ]
]
