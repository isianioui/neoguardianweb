# Kotlin Implementation for NEO-Orrery Mobile App

## Firebase Setup for Kotlin

Add these dependencies to your `build.gradle` file:

```gradle
// Firebase dependencies
implementation platform('com.google.firebase:firebase-bom:32.3.1')
implementation 'com.google.firebase:firebase-database-ktx'
```

## Notification Model Class

```kotlin
data class CollisionNotification(
    val id: String = "",
    val timestamp: String = "",
    val objects: Map<String, String> = mapOf(),
    val probability: Double = 0.0,
    val minDistance: Double = 0.0,
    val nearestPlanet: String = "",
    val distanceToEarth: Double = 0.0,
    val read: Boolean = false
)
```

## Firebase Service

```kotlin
import com.google.firebase.database.*
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

class NotificationService {
    private val database = FirebaseDatabase.getInstance()
    private val notificationsRef = database.getReference("notifications")
    
    // Get notifications as a Flow for real-time updates
    fun getNotificationsFlow(): Flow<List<CollisionNotification>> = callbackFlow {
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val notifications = snapshot.children.mapNotNull { 
                    it.getValue(CollisionNotification::class.java) 
                }
                trySend(notifications)
            }
            
            override fun onCancelled(error: DatabaseError) {
                // Handle error
            }
        }
        
        notificationsRef.addValueEventListener(listener)
        
        // Remove the listener when the flow is cancelled
        awaitClose {
            notificationsRef.removeEventListener(listener)
        }
    }
    
    // Mark notification as read
    fun markAsRead(notificationId: String) {
        notificationsRef.child(notificationId).child("read").setValue(true)
    }
    
    // Delete a notification
    fun deleteNotification(notificationId: String) {
        notificationsRef.child(notificationId).removeValue()
    }
}
```

## ViewModel Implementation

```kotlin
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class NotificationsViewModel(
    private val notificationService: NotificationService
) : ViewModel() {
    
    private val _notifications = MutableStateFlow<List<CollisionNotification>>(emptyList())
    val notifications: StateFlow<List<CollisionNotification>> = _notifications
    
    init {
        viewModelScope.launch {
            notificationService.getNotificationsFlow().collect { notificationsList ->
                _notifications.value = notificationsList
            }
        }
    }
    
    fun markAsRead(notificationId: String) {
        notificationService.markAsRead(notificationId)
    }
    
    fun deleteNotification(notificationId: String) {
        notificationService.deleteNotification(notificationId)
    }
}
```

## UI Implementation (Jetpack Compose)

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun NotificationsScreen(viewModel: NotificationsViewModel) {
    val notifications by viewModel.notifications.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Collision Notifications") }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (notifications.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No notifications available")
                    }
                }
            } else {
                items(notifications) { notification ->
                    NotificationCard(
                        notification = notification,
                        onMarkAsRead = { viewModel.markAsRead(notification.id) },
                        onDelete = { viewModel.deleteNotification(notification.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun NotificationCard(
    notification: CollisionNotification,
    onMarkAsRead: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = 4.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "High Risk Collision Alert!",
                style = MaterialTheme.typography.h6
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text("Objects: ${notification.objects}")
            Text("Probability: ${notification.probability}")
            Text("Nearest Planet: ${notification.nearestPlanet}")
            Text("Distance to Earth: ${notification.distanceToEarth} km")
            Text("Minimum Distance: ${notification.minDistance} km")
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                if (!notification.read) {
                    Button(
                        onClick = onMarkAsRead,
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Text("Mark as Read")
                    }
                }
                
                Button(
                    onClick = onDelete
                ) {
                    Text("Delete")
                }
            }
        }
    }
}
```