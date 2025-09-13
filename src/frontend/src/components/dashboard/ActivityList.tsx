import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Chip
} from '@mui/material';
import { drokexColors } from '../../theme/drokexTheme';

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'product' | 'lead' | 'company' | 'user' | 'order';
  icon?: React.ReactNode;
  status?: 'new' | 'pending' | 'completed' | 'urgent';
}

interface ActivityListProps {
  title: string;
  activities: Activity[];
  maxItems?: number;
}

const ActivityList: React.FC<ActivityListProps> = ({
  title,
  activities,
  maxItems = 5
}) => {
  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'product':
        return { bg: drokexColors.primary, text: drokexColors.dark };
      case 'lead':
        return { bg: drokexColors.secondary, text: '#ffffff' };
      case 'company':
        return { bg: '#2196f3', text: '#ffffff' };
      case 'user':
        return { bg: '#9c27b0', text: '#ffffff' };
      case 'order':
        return { bg: '#4caf50', text: '#ffffff' };
      default:
        return { bg: drokexColors.primary, text: drokexColors.dark };
    }
  };

  const getStatusChip = (status?: Activity['status']) => {
    if (!status) return null;

    const statusColors = {
      new: { bg: '#4caf50', text: '#ffffff' },
      pending: { bg: '#ff9800', text: '#ffffff' },
      completed: { bg: '#2196f3', text: '#ffffff' },
      urgent: { bg: '#f44336', text: '#ffffff' }
    };

    const colors = statusColors[status];
    
    return (
      <Chip
        label={status}
        size="small"
        sx={{
          bgcolor: colors.bg,
          color: colors.text,
          fontSize: '0.7rem',
          height: 20,
          textTransform: 'capitalize'
        }}
      />
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `hace ${diffMins}m`;
    } else if (diffHours < 24) {
      return `hace ${diffHours}h`;
    } else if (diffDays < 7) {
      return `hace ${diffDays}d`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: `1px solid ${drokexColors.pale}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: drokexColors.primary,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            color: drokexColors.dark,
            fontWeight: 600,
            mb: 2
          }}
        >
          {title}
        </Typography>

        {displayActivities.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
              textAlign: 'center'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: drokexColors.secondary,
                fontStyle: 'italic'
              }}
            >
              No hay actividades recientes
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {displayActivities.map((activity, index) => {
              const colorScheme = getActivityColor(activity.type);
              
              return (
                <ListItem
                  key={activity.id}
                  sx={{
                    px: 0,
                    py: 1.5,
                    borderBottom: index < displayActivities.length - 1 
                      ? `1px solid ${drokexColors.pale}` 
                      : 'none',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: colorScheme.bg,
                        color: colorScheme.text,
                        width: 40,
                        height: 40
                      }}
                    >
                      {activity.icon || activity.type.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: drokexColors.dark,
                            fontWeight: 500,
                            flex: 1
                          }}
                        >
                          {activity.title}
                        </Typography>
                        {getStatusChip(activity.status)}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: drokexColors.secondary,
                            fontSize: '0.85rem',
                            mb: 0.5
                          }}
                        >
                          {activity.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: drokexColors.secondary,
                            fontSize: '0.75rem'
                          }}
                        >
                          {formatTimestamp(activity.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityList;