import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { RefreshCw, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface EditPlayerDialogProps {
  player: {
    id: string
    username: string
    wagered_amount: number
    games_played: number
    win_streak: number
    total_won: number
    total_lost: number
    site_name: string
  } | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditPlayerDialog({ player, isOpen, onClose, onSave }: EditPlayerDialogProps) {
  const [formData, setFormData] = useState({
    username: '',
    wagered_amount: '',
    games_played: '',
    win_streak: '',
    total_won: '',
    total_lost: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Initialize form data when player changes
  useEffect(() => {
    if (player) {
      setFormData({
        username: player.username,
        wagered_amount: player.wagered_amount.toString(),
        games_played: player.games_played.toString(),
        win_streak: player.win_streak.toString(),
        total_won: player.total_won.toString(),
        total_lost: player.total_lost.toString()
      })
    }
  }, [player])

  const handleSave = async () => {
    if (!player) return

    setLoading(true)
    setMessage('')

    try {
      // Update user statistics
      const { error: statsError } = await supabase
        .from('user_statistics')
        .update({
          wagered_amount: parseFloat(formData.wagered_amount) || 0,
          games_played: parseInt(formData.games_played) || 0,
          win_streak: parseInt(formData.win_streak) || 0,
          total_won: parseFloat(formData.total_won) || 0,
          total_lost: parseFloat(formData.total_lost) || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id)

      if (statsError) throw statsError

      // Update username in users table
      const { data: userStats } = await supabase
        .from('user_statistics')
        .select('user_id')
        .eq('id', player.id)
        .single()

      if (userStats) {
        const { error: userError } = await supabase
          .from('users')
          .update({ username: formData.username })
          .eq('id', userStats.user_id)

        if (userError) throw userError
      }

      setMessage('✅ Player updated successfully!')
      setTimeout(() => {
        onSave()
        onClose()
      }, 1000)

    } catch (error) {
      console.error('Error updating player:', error)
      setMessage('❌ Error updating player')
    } finally {
      setLoading(false)
    }
  }

  if (!player) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black/95 border-yellow-400/30">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">Edit Player</DialogTitle>
          <DialogDescription className="text-gray-300">
            Modify player details and statistics for {player.site_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-username" className="text-yellow-400">Username</Label>
            <Input
              id="edit-username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="bg-black/40 border-yellow-400/30 text-white"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-wagered" className="text-yellow-400">Wagered ($)</Label>
              <Input
                id="edit-wagered"
                type="number"
                step="0.01"
                value={formData.wagered_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, wagered_amount: e.target.value }))}
                className="bg-black/40 border-yellow-400/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-games" className="text-yellow-400">Games</Label>
              <Input
                id="edit-games"
                type="number"
                value={formData.games_played}
                onChange={(e) => setFormData(prev => ({ ...prev, games_played: e.target.value }))}
                className="bg-black/40 border-yellow-400/30 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-won" className="text-yellow-400">Total Won ($)</Label>
              <Input
                id="edit-won"
                type="number"
                step="0.01"
                value={formData.total_won}
                onChange={(e) => setFormData(prev => ({ ...prev, total_won: e.target.value }))}
                className="bg-black/40 border-yellow-400/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-streak" className="text-yellow-400">Win Streak</Label>
              <Input
                id="edit-streak"
                type="number"
                value={formData.win_streak}
                onChange={(e) => setFormData(prev => ({ ...prev, win_streak: e.target.value }))}
                className="bg-black/40 border-yellow-400/30 text-white"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-center ${
            message.includes('✅') 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-yellow-400 text-black hover:bg-yellow-500"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}