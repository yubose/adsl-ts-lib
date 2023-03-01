import loglevel from 'loglevel'

// loglevel.setDefaultLevel('INFO')
let env = process.env.NODE_ENV

if (env === 'development') {
    loglevel.setDefaultLevel('DEBUG')
    loglevel.setLevel("DEBUG")
}else{
    loglevel.setDefaultLevel('WARN')
    loglevel.setLevel("WARN")
}

export default loglevel
