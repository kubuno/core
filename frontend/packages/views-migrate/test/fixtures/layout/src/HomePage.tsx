import Badge from './Badge'
import EditDialog from './EditDialog'
import List from './List'

export default function HomePage() {
  return (
    <div>
      <Badge />
      <List />
      <EditDialog onClose={() => undefined} />
    </div>
  )
}
