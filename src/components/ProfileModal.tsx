import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useState, useEffect } from 'react'
import { User, Calendar, MapPin, Heart } from 'lucide-react'
import { SteamUser } from '../services/steam-auth'
import { supabase } from '../lib/supabase'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
  user: SteamUser | null
}

export function ProfileModal({ open, onClose, user }: ProfileModalProps) {
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [favoriteSites, setFavoriteSites] = useState('')
  const [memberSince, setMemberSince] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Fetch user's creation date when modal opens
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !open) return

      setLoading(true)
      try {
        // Get user's creation date from database
        const { data, error } = await supabase
          .from('users')
          .select('created_at')
          .eq('steam_id', user.steamId)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
          setMemberSince('Unknown')
        } else if (data?.created_at) {
          // Format the date nicely
          const createdDate = new Date(data.created_at)
          const formattedDate = createdDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })
          setMemberSince(formattedDate)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        setMemberSince('Unknown')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, open])

  const handleSave = () => {
    // Here you would save the profile data
    console.log('Saving profile:', { bio, location, favoriteSites })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-black border-yellow-400/30 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center gold-gradient glow-text">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-center text-gray-300">
            Update your personal information and preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Profile Picture and Basic Info - Display Only */}
          <div className="flex items-center space-x-6 justify-center">
            <Avatar className="w-20 h-20 border-4 border-yellow-400">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-yellow-400 text-black text-2xl">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-bold text-yellow-400 glow-text">
                {user?.username || 'Unknown User'}
              </h2>
              <p className="text-gray-400 text-sm">Steam Account</p>
            </div>
          </div>
          
          {/* Editable Profile Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-yellow-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                About Me
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className="bg-black/40 border-yellow-400/30 text-white focus:border-yellow-400 transition-colors"
              />
              <p className="text-xs text-gray-400">Share a bit about yourself with the community</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-yellow-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="bg-black/40 border-yellow-400/30 text-white focus:border-yellow-400 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="favoriteSites" className="text-yellow-400 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Favorite Sites
                </Label>
                <Input
                  id="favoriteSites"
                  value={favoriteSites}
                  onChange={(e) => setFavoriteSites(e.target.value)}
                  placeholder="Your preferred gambling sites"
                  className="bg-black/40 border-yellow-400/30 text-white focus:border-yellow-400 transition-colors"
                />
              </div>
            </div>
          </div>
          
          {/* Account Information - Display Only */}
          <Card className="card-glow bg-black/60 border-yellow-400/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2 text-yellow-400">
                <Calendar className="w-5 h-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Account Type</p>
                  <p className="text-white font-medium">Steam User</p>
                </div>
                <div>
                  <p className="text-gray-400">Member Since</p>
                  <div className="flex items-center gap-2">
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <p className="text-white font-medium">{memberSince}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400">Profile Status</p>
                  <Badge className="bg-green-400/20 text-green-400 text-xs">Active</Badge>
                </div>
                <div>
                  <p className="text-gray-400">Platform</p>
                  <p className="text-white font-medium">Bet Cin</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button 
              onClick={handleSave}
              className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 glow-hover font-medium"
            >
              Save Profile
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 font-medium"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}